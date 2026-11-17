
const SUPABASE_CONFIG = window.SOFIBRIE_SUPABASE_CONFIG || {};
const DOMAINE_EMAIL_AUTORISE = '@sofibrie.fr';
let supabaseClient = null;
let currentUser = null;
let notesChannel = null;

        function ouvrirEcran(nomEcran) {
            document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active-screen'));
            const cible = document.getElementById('screen-' + nomEcran);
            if (cible) cible.classList.add('active-screen');

            document.getElementById('quick-app-select').value = nomEcran;
            if (typeof majMenuRapide === 'function') majMenuRapide(nomEcran);
            const btnBack = document.getElementById('btn-back-hub');
            const mainTitle = document.getElementById('header-main-title');
            const subTitle = document.getElementById('header-sub-title');

            if (nomEcran === 'hub') {
                btnBack.classList.add('hidden');
                mainTitle.textContent = "PORTAIL OUTILS ATELIER";
                subTitle.textContent = "Sélectionnez un logiciel métier pour démarrer";
            } else if (nomEcran === 'stock') {
                btnBack.classList.remove('hidden');
                mainTitle.textContent = "VÉRIFICATION STOCK (2 ÉTAPES)";
                subTitle.textContent = "Étape 1 : Stock Magasin — Étape 2 : Disponibilité Usine pour les pièces manquantes";
            } else if (nomEcran === 'blocnote') {
                btnBack.classList.remove('hidden');
                mainTitle.textContent = "BLOC-NOTES ATELIER & CLIENT";
                subTitle.textContent = "Fiche express client, liaison véhicule automatique et prises de devis";
                chargerHistoriqueNotes();
            } else if (nomEcran === 'convertisseur') {
                btnBack.classList.remove('hidden');
                mainTitle.textContent = "CONVERTISSEUR NISSAN GASS → DCSNET";
                subTitle.textContent = "Générateur de fichiers d'importation .CSV et .WFT (Code 9000)";
            } else if (nomEcran === 'conv-mg') {
                btnBack.classList.remove('hidden');
                mainTitle.textContent = "CONVERTISSEUR MG → DCSNET";
                subTitle.textContent = "Générateur de fichiers d'importation .CSV et .WFT (Code 6000)";
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        /* -------------------------------------------------------------------------
           BASE DE DONNÉES LOCALE (localStorage) & GESTION VÉHICULE
           ------------------------------------------------------------------------- */
        const STORAGE_KEY_VEH = 'atelier_sofibrie_vehicules_db';

        const inputImmat = document.getElementById('input-veh-immat');
        const inputModele = document.getElementById('input-veh-modele');
        const inputVin = document.getElementById('input-veh-vin');
        const inputDate = document.getElementById('input-veh-date');

        let infoVehicule = {
            modele: "Non renseigné",
            immat: "--",
            vin: "--",
            dateConst: "--"
        };

        function chargerBaseVehicules() {
            try {
                const brut = localStorage.getItem(STORAGE_KEY_VEH);
                return brut ? JSON.parse(brut) : [];
            } catch (e) {
                return [];
            }
        }

        function sauvegarderBaseVehicules(base) {
            localStorage.setItem(STORAGE_KEY_VEH, JSON.stringify(base));
            mettreAJourCompteurBase();
        }

        function mettreAJourCompteurBase() {
            const badge = document.getElementById('db-count-badge');
            if (badge) badge.textContent = chargerBaseVehicules().length;
        }

        function chercherPlaqueDansBase(plaque) {
            const cle = plaque.trim().toUpperCase().replace(/[\s-]/g, '');
            if (cle.length < 4) return null;
            const base = chargerBaseVehicules();
            return base.find(v => v.immat && v.immat.replace(/[\s-]/g, '') === cle);
        }

        function animerConfirmationDetection() {
            const card = document.getElementById('vehicule-card');
            card.style.borderColor = '#10b981';
            card.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.35)';
            setTimeout(() => {
                card.style.borderColor = 'rgba(59, 130, 246, 0.35)';
                card.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
            }, 1000);
        }

        function synchroniserDonneesVehicule(enregistrerEnBase = true) {
            infoVehicule.immat = inputImmat.value.trim().toUpperCase() || '--';
            infoVehicule.modele = inputModele.value.trim() || 'Non renseigné';
            infoVehicule.vin = inputVin.value.trim().toUpperCase() || '--';
            infoVehicule.dateConst = inputDate.value.trim() || '--';

            if (!enregistrerEnBase) return;

            if (infoVehicule.immat !== '--' && (infoVehicule.vin !== '--' || infoVehicule.modele !== 'Non renseigné')) {
                let base = chargerBaseVehicules();
                const immatNettoyee = infoVehicule.immat.replace(/[\s-]/g, '');
                const index = base.findIndex(v => v.immat && v.immat.replace(/[\s-]/g, '') === immatNettoyee);

                const fiche = {
                    immat: infoVehicule.immat,
                    modele: infoVehicule.modele,
                    vin: infoVehicule.vin,
                    dateConst: infoVehicule.dateConst,
                    dateMaj: new Date().toLocaleDateString('fr-FR')
                };

                if (index !== -1) {
                    base[index] = fiche;
                } else {
                    base.unshift(fiche);
                }
                sauvegarderBaseVehicules(base);
            }
        }

        inputImmat.addEventListener('input', () => {
            const saisie = inputImmat.value.trim().toUpperCase();
            if (!saisie) return;

            const trouve = chercherPlaqueDansBase(saisie);
            if (trouve) {
                inputModele.value = (trouve.modele && trouve.modele !== 'Non renseigné') ? trouve.modele : '';
                inputVin.value = (trouve.vin && trouve.vin !== '--') ? trouve.vin : '';
                inputDate.value = (trouve.dateConst && trouve.dateConst !== '--') ? trouve.dateConst : '';
                animerConfirmationDetection();
                synchroniserDonneesVehicule(false);
            } else {
                synchroniserDonneesVehicule(true);
            }
        });

        [inputModele, inputVin, inputDate].forEach(champ => {
            champ.addEventListener('input', () => synchroniserDonneesVehicule(true));
        });

        document.getElementById('btn-vider-veh').addEventListener('click', () => {
            inputImmat.value = '';
            inputModele.value = '';
            inputVin.value = '';
            inputDate.value = '';
            synchroniserDonneesVehicule(false);
        });

        function appliquerInfosVehicule(data, enregistrer = false) {
            inputImmat.value = (data.immat && data.immat !== '--') ? data.immat : '';
            inputModele.value = (data.modele && data.modele !== 'Non renseigné') ? data.modele : '';
            inputVin.value = (data.vin && data.vin !== '--') ? data.vin : '';
            inputDate.value = (data.dateConst && data.dateConst !== '--') ? data.dateConst : '';

            animerConfirmationDetection();
            synchroniserDonneesVehicule(enregistrer);
        }

        /* -------------------------------------------------------------------------
           MOTEUR D'EXTRACTION DE TEXTE & SCAN OCR (BLINDÉ SIV / VIN / MICROCAT)
           ------------------------------------------------------------------------- */
        function extraireInfosDepuisTexte(texteBrut) {
            if (!texteBrut) return false;
            let trouve = false;

            // 1. Modèle (Nissan & MG)
            const modMatch = texteBrut.match(/\b(PIXO|JUKE|QASHQAI|MICRA(?:\s*C\+C)?|X-TRAIL|NAVARA|LEAF|NOTE|PULSAR|ARIYA|TOWNSTAR|PRIMASTAR|INTERSTAR|MG4|MG ZS|MG3|MG5|MG EHS|CYBERSTER)[^\n\r]*/i);
            if (modMatch) {
                inputModele.value = modMatch[0].replace(/\s+/g, ' ').trim().slice(0, 35);
                trouve = true;
            }

            // 2. Immatriculation (Recherche ciblée après label ou par motif SIV)
            let immatBrute = null;
            const matchApresLabel = texteBrut.match(/Immatriculation[^\w\n\r]*([A-Z0-9\s-]{6,12})/i);
            if (matchApresLabel) {
                immatBrute = matchApresLabel[1].replace(/[\s-]/g, '').toUpperCase();
            } else {
                const matchGen = texteBrut.match(/\b([A-Z0-9]{2}[- ]?[A-Z0-9]{3}[- ]?[A-Z0-9]{2})\b/i);
                if (matchGen) immatBrute = matchGen[1].replace(/[\s-]/g, '').toUpperCase();
            }

            if (immatBrute && immatBrute.length >= 7) {
                let car = immatBrute.slice(0, 7).split('');
                const versLettre = (c) => ({ '8': 'B', '2': 'Z', '0': 'O', '1': 'I', '5': 'S', '6': 'G' }[c] || c);
                const versChiffre = (c) => ({ 'B': '8', 'Z': '2', 'O': '0', 'I': '1', 'S': '5', 'G': '6' }[c] || c);

                car[0] = versLettre(car[0]);
                car[1] = versLettre(car[1]);
                car[2] = versChiffre(car[2]);
                car[3] = versChiffre(car[3]);
                car[4] = versChiffre(car[4]);
                car[5] = versLettre(car[5]);
                car[6] = versLettre(car[6]);

                inputImmat.value = car.join('');
                trouve = true;
            }

            // 3. VIN / N° Châssis
            let vinBrut = null;
            const vinMatchLabel = texteBrut.match(/VIN[^\w\n\r]*([A-Z0-9\s]{15,22})/i);
            if (vinMatchLabel) {
                vinBrut = vinMatchLabel[1].replace(/\s+/g, '').toUpperCase();
            } else {
                const matchGenVIN = texteBrut.match(/\b([A-Z0-9]{17})\b/i);
                if (matchGenVIN) vinBrut = matchGenVIN[1].toUpperCase();
            }

            if (vinBrut && vinBrut.length >= 17) {
                let vinNet = vinBrut.slice(0, 17);
                if (vinNet.startsWith("S1N") || vinNet.startsWith("SIN")) {
                    vinNet = "SJN" + vinNet.slice(3);
                }
                if (vinNet.startsWith("SJN") && vinNet[3] === 'Z') {
                    vinNet = vinNet.substring(0, 3) + '2' + vinNet.substring(4);
                }
                vinNet = vinNet.replace(/O/g, '0').replace(/Q/g, '0');
                inputVin.value = vinNet;
                trouve = true;
            }

            // 4. Date de construction
            const dateConstrMatch = texteBrut.match(/(?:construction|date)[^\d\n\r]*([0-1]?[0-9])\s*[\/]\s*([12][0-9]{3})/i);
            if (dateConstrMatch) {
                const mois = dateConstrMatch[1].padStart(2, '0');
                const annee = dateConstrMatch[2];
                inputDate.value = `${mois}/${annee}`;
                trouve = true;
            }

            if (trouve) {
                animerConfirmationDetection();
                synchroniserDonneesVehicule(true);
            }
            return trouve;
        }

        async function analyserImageOCR(imageSource) {
            const loader = document.getElementById('ocr-loader-text');
            loader.classList.remove('hidden');
            loader.textContent = "⏳ Analyse de l'image (OCR)...";

            try {
                if (typeof Tesseract === 'undefined') {
                    throw new Error("Bibliothèque OCR non chargée.");
                }
                const res = await Tesseract.recognize(imageSource, 'fra+eng', {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            loader.textContent = `⏳ Détection du texte : ${Math.round(m.progress * 100)}%`;
                        }
                    }
                });

                const texteExtrait = res.data.text;
                const reussi = extraireInfosDepuisTexte(texteExtrait);

                if (reussi) {
                    loader.textContent = "✓ Véhicule détecté !";
                    setTimeout(() => loader.classList.add('hidden'), 2200);
                } else {
                    loader.textContent = "⚠️ Aucun VIN ou Plaque lisible";
                    setTimeout(() => loader.classList.add('hidden'), 2600);
                }
            } catch (err) {
                loader.textContent = "✕ Erreur lecture image";
                setTimeout(() => loader.classList.add('hidden'), 2600);
            }
        }

        document.addEventListener('paste', (e) => {
            const items = (e.clipboardData || window.clipboardData).items;
            let imageTrouvee = false;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    analyserImageOCR(blob);
                    imageTrouvee = true;
                    break;
                }
            }

            if (imageTrouvee) return;

            if (['TEXTAREA', 'INPUT'].includes(e.target.tagName)) return;
            const texteColle = (e.clipboardData || window.clipboardData).getData('text');
            if (texteColle) {
                extraireInfosDepuisTexte(texteColle);
            }
        });

        const fileInputOcr = document.getElementById('file-input-ocr');
        document.getElementById('btn-trigger-ocr').addEventListener('click', () => fileInputOcr.click());
        fileInputOcr.addEventListener('change', (e) => {
            if (e.target.files.length) {
                analyserImageOCR(e.target.files[0]);
            }
        });

        /* -------------------------------------------------------------------------
           GESTION MODALE BASE DE DONNÉES VÉHICULES
           ------------------------------------------------------------------------- */
        const modalDbVeh = document.getElementById('modal-db-veh');
        const inputSearchDb = document.getElementById('input-search-db-veh');

        document.getElementById('btn-open-db-veh').addEventListener('click', () => {
            inputSearchDb.value = '';
            afficherTableauBase();
            modalDbVeh.classList.remove('hidden');
        });

        document.getElementById('btn-close-db-veh').addEventListener('click', () => {
            modalDbVeh.classList.add('hidden');
        });

        inputSearchDb.addEventListener('input', afficherTableauBase);

        function afficherTableauBase() {
            const base = chargerBaseVehicules();
            const filtre = inputSearchDb.value.trim().toLowerCase();
            const tbody = document.getElementById('db-veh-table-body');
            tbody.innerHTML = '';

            const filtres = base.filter(v => 
                (v.immat && v.immat.toLowerCase().includes(filtre)) ||
                (v.vin && v.vin.toLowerCase().includes(filtre)) ||
                (v.modele && v.modele.toLowerCase().includes(filtre))
            );

            if (!filtres.length) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">Aucun véhicule enregistré pour le moment.</td></tr>`;
                return;
            }

            filtres.forEach(v => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid var(--border-subtle)';
                tr.innerHTML = `
                    <td style="padding: 8px 10px; font-family: monospace; font-weight: 700; color: #fff;">${v.immat}</td>
                    <td style="padding: 8px 10px; font-family: monospace; color: var(--text-secondary);">${v.vin}</td>
                    <td style="padding: 8px 10px;">${v.modele}</td>
                    <td style="padding: 8px 10px; text-align: center;">${v.dateConst || '--'}</td>
                    <td style="padding: 8px 10px; text-align: center; display: flex; gap: 6px; justify-content: center;">
                        <button class="btn btn-blue btn-charger-veh" style="padding: 4px 8px; font-size: 11px;">⚡ Charger</button>
                        <button class="btn btn-glass btn-suppr-veh" style="padding: 4px 8px; font-size: 11px; color: #fb7185;">✕</button>
                    </td>
                `;

                tr.querySelector('.btn-charger-veh').addEventListener('click', () => {
                    appliquerInfosVehicule(v, false);
                    modalDbVeh.classList.add('hidden');
                });

                tr.querySelector('.btn-suppr-veh').addEventListener('click', () => {
                    if (confirm(`Supprimer le véhicule ${v.immat} (${v.vin}) de la base ?`)) {
                        const nouvelleBase = chargerBaseVehicules().filter(item => !(item.vin === v.vin && item.immat === v.immat));
                        sauvegarderBaseVehicules(nouvelleBase);
                        afficherTableauBase();
                    }
                });

                tbody.appendChild(tr);
            });
        }

        document.getElementById('btn-export-db-json').addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(chargerBaseVehicules(), null, 2));
            sauverFichier("base_vehicules_atelier.json", JSON.stringify(chargerBaseVehicules(), null, 2));
        });

        document.getElementById('btn-export-db-csv').addEventListener('click', () => {
            const base = chargerBaseVehicules();
            let csv = "Immatriculation;VIN;Modele;DateConstruction;DerniereMaj\n";
            base.forEach(v => {
                csv += `"${v.immat}";"${v.vin}";"${v.modele}";"${v.dateConst}";"${v.dateMaj || ''}"\n`;
            });
            const blob = new Blob([csv], { type: 'text/csv;charset=windows-1252;' });
            sauverFichier("base_vehicules_atelier.csv", blob);
        });

        const fileImportDb = document.getElementById('file-import-db');
        document.getElementById('btn-import-db-trigger').addEventListener('click', () => fileImportDb.click());
        fileImportDb.addEventListener('change', (e) => {
            if (!e.target.files.length) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const imported = JSON.parse(evt.target.result);
                    if (Array.isArray(imported)) {
                        sauvegarderBaseVehicules(imported);
                        afficherTableauBase();
                        alert(`✅ ${imported.length} véhicules importés avec succès !`);
                    }
                } catch (err) {
                    alert("Erreur lors de la lecture du fichier JSON.");
                }
            };
            reader.readAsText(e.target.files[0]);
        });

        mettreAJourCompteurBase();

        /* -------------------------------------------------------------------------
           SECTION 2 : LOGIQUE BLOC-NOTES ATELIER & CLIENT
           ------------------------------------------------------------------------- */
        const STORAGE_KEY_NOTES = 'atelier_sofibrie_notes_db';
        const STORAGE_KEY_MIGRATION_DEVICE = 'atelier_sofibrie_notes_device_id';
        let notesPartagees = [];
        let noteEnEditionId = null;

        const bnNomClient = document.getElementById('bn-nom-client');
        const bnCodeClient = document.getElementById('bn-code-client');
        const bnTelClient = document.getElementById('bn-tel-client');
        const bnImmat = document.getElementById('bn-immat');
        const bnModele = document.getElementById('bn-modele');
        const bnVin = document.getElementById('bn-vin');
        const bnTexte = document.getElementById('bn-texte-notes');
        const bnListeConteneur = document.getElementById('bn-liste-notes');
        const bnFiltre = document.getElementById('bn-filtre-notes');
        const bnCountBadge = document.getElementById('bn-notes-count');

        // Pré-remplissage automatique dès que la plaque est saisie dans le bloc-notes
        bnImmat.addEventListener('input', () => {
            const saisie = bnImmat.value.trim().toUpperCase();
            if (!saisie) return;
            const trouve = chercherPlaqueDansBase(saisie);
            if (trouve) {
                if (trouve.modele && trouve.modele !== 'Non renseigné') bnModele.value = trouve.modele;
                if (trouve.vin && trouve.vin !== '--') bnVin.value = trouve.vin;
                bnImmat.style.borderColor = '#10b981';
                setTimeout(() => bnImmat.style.borderColor = 'rgba(59, 130, 246, 0.45)', 1200);
            }
        });

        function viderFormulaireBn() {
            [bnNomClient, bnCodeClient, bnTelClient, bnImmat, bnModele, bnVin, bnTexte, $id('bn-mail-client'), $id('bn-adresse-client'), $id('bn-ref-input'), $id('bn-ref-desig')].forEach(el => { el.value = ''; });
            $id('bn-ref-qty').value = 1;
            bnRefs = []; renderBnRefs();
            noteEnEditionId = null;
            $id('btn-bn-sauvegarder').textContent = '💾 Sauvegarder';
            bnNomClient.focus();
        }
        document.getElementById('btn-bn-nouveau').addEventListener('click', () => {
            if ((bnTexte.value.trim() || bnRefs.length || bnNomClient.value.trim()) && !confirm("Effacer les champs pour une nouvelle note ?")) return;
            viderFormulaireBn();
        });

        document.getElementById('btn-bn-sauvegarder').addEventListener('click', async () => {
            const client = bnNomClient.value.trim() || 'Client sans nom';
            const immat = bnImmat.value.trim().toUpperCase() || '--';
            const notes = bnTexte.value.trim();

            if (!notes && !bnRefs.length && immat === '--' && client === 'Client sans nom') {
                alert("La note est vide. Renseignez au moins un nom client, une plaque ou du texte.");
                return;
            }

            const now = new Date();
            const dateStr = now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            const note = {
                client: client,
                code_client: bnCodeClient.value.trim(),
                tel: bnTelClient.value.trim(),
                mail: $id('bn-mail-client').value.trim(),
                adresse: $id('bn-adresse-client').value.trim(),
                immat: immat,
                modele: bnModele.value.trim(),
                vin: bnVin.value.trim().toUpperCase(),
                notes: notes,
                refs: bnRefs.map(({ ref, qty, desig, st }) => ({ ref, qty, desig, st }))
            };
            const isEditing = noteEnEditionId !== null;
            if (!isEditing) note.note_date = dateStr;

            if (!supabaseClient || !currentUser) {
                alert('Connecte-toi pour enregistrer une fiche.');
                return;
            }

            const saveButton = $id('btn-bn-sauvegarder');
            saveButton.disabled = true;
            try {
                const result = isEditing
                    ? await supabaseClient.from('atelier_notes').update(note).eq('id', noteEnEditionId).select().single()
                    : await supabaseClient.from('atelier_notes').insert(note).select().single();
                if (result.error) throw result.error;
                if (!result.data) throw new Error('La base de données n’a renvoyé aucune fiche enregistrée.');
            } catch (error) {
                alert(`Impossible d’enregistrer la fiche : ${error.message || 'erreur de connexion à la base de données.'}`);
                saveButton.disabled = false;
                return;
            }

            if (immat !== '--' && (bnVin.value.trim() || bnModele.value.trim())) {
                enregistrerVehiculeDansBase({
                    immat: immat,
                    vin: bnVin.value.trim().toUpperCase() || '--',
                    modele: bnModele.value.trim() || 'Non renseigné',
                    dateConst: '--'
                });
            }

            await chargerHistoriqueNotes();
            viderFormulaireBn();
            saveButton.disabled = false;
            alert(isEditing
                ? '✓ Fiche mise à jour.'
                : '✓ Fiche enregistrée dans l’espace partagé de l’équipe.');
        });

        /* ---- Liste de références du bloc-notes ---- */
        let bnRefs = [], bnRefSeq = 0;
        const LIBELLE_ST = { stock: 'En stock', usine: 'Dispo usine', pasdispo: 'Pas dispo' };

        function ajouterRefBn(ref, qty, desig) {
            ref = String(ref || '').trim().toUpperCase().replace(/\s+/g, '');
            if (!ref) return false;
            bnRefs.push({ id: ++bnRefSeq, ref, qty: nbQty(qty), desig: String(desig || '').trim(), st: null });
            return true;
        }

        function importerRefsDuTexte(texte) {
            let n = 0;
            texte.split(/\r?\n/).forEach(l => {
                const m = l.trim().match(/^([A-Z0-9][A-Z0-9-]{5,})(?:\s*[xX×]\s*(\d+))?\s*(?:[-–:]\s*)?(.*)$/i);
                if (m && /\d/.test(m[1]) && !bnRefs.some(r => r.ref === m[1].toUpperCase()) && ajouterRefBn(m[1], m[2] || 1, m[3])) n++;
            });
            renderBnRefs();
            return n;
        }

        function renderBnRefs() {
            const c = $id('bn-ref-liste'), cnt = k => bnRefs.filter(r => r.st === k).length;
            $id('bn-ref-resume').textContent = bnRefs.length ? `${bnRefs.length} réf. · 🏠 ${cnt('stock')} · 🏭 ${cnt('usine')} · ❌ ${cnt('pasdispo')}` : '';
            if (!bnRefs.length) { c.innerHTML = '<div class="bn-ref-vide">Aucune référence — ajoutez-en ci-dessus ou importez la zone de texte.</div>'; return; }
            const btns = [['stock', '🏠 En stock'], ['usine', '🏭 Dispo usine'], ['pasdispo', '❌ Pas dispo']];
            c.innerHTML = bnRefs.map(r => `<div class="bn-ref-row" data-id="${r.id}">
                <div class="bn-ref-info"><span class="bn-ref-code">${esc(r.ref)}</span><span class="bn-ref-qty">x${esc(r.qty)}</span><span class="bn-ref-des">${esc(r.desig)}</span></div>
                <div class="bn-ref-btns">${btns.map(([k, l]) => `<button type="button" class="bn-st-btn bn-k-${k}${r.st === k ? ' on' : ''}" data-act="${k}">${l}</button>`).join('')}<button type="button" class="bn-st-btn bn-del" data-act="del" title="Supprimer">✕</button></div>
            </div>`).join('');
        }

        function validerAjoutRef() {
            if (ajouterRefBn($id('bn-ref-input').value, $id('bn-ref-qty').value, $id('bn-ref-desig').value)) {
                $id('bn-ref-input').value = ''; $id('bn-ref-qty').value = 1; $id('bn-ref-desig').value = '';
                renderBnRefs();
            }
            $id('bn-ref-input').focus();
        }

        $id('bn-ref-add').addEventListener('click', validerAjoutRef);
        ['bn-ref-input', 'bn-ref-qty', 'bn-ref-desig'].forEach(id => $id(id).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); validerAjoutRef(); } }));
        $id('bn-ref-input').addEventListener('paste', e => {
            const t = (e.clipboardData || window.clipboardData).getData('text');
            if (/\r?\n/.test(t.trim())) { e.preventDefault(); importerRefsDuTexte(t); }
        });
        $id('bn-ref-import').addEventListener('click', () => {
            if (!importerRefsDuTexte(bnTexte.value)) alert("Aucune nouvelle référence détectée dans la zone de texte.\nFormat attendu : 260424CA0A x2 - Désignation");
        });
        $id('bn-ref-liste').addEventListener('click', e => {
            const b = e.target.closest('button[data-act]'); if (!b) return;
            const id = Number(b.closest('.bn-ref-row').dataset.id), r = bnRefs.find(x => x.id === id); if (!r) return;
            if (b.dataset.act === 'del') bnRefs = bnRefs.filter(x => x.id !== id);
            else r.st = (r.st === b.dataset.act) ? null : b.dataset.act;
            renderBnRefs();
        });
        renderBnRefs();

        function enregistrerVehiculeDansBase(v) {
            const base = chargerBaseVehicules(), cle = v.immat.replace(/[\s-]/g, '');
            const i = base.findIndex(x => x.immat && x.immat.replace(/[\s-]/g, '') === cle);
            const fiche = { ...v, dateMaj: new Date().toLocaleDateString('fr-FR') };
            if (i >= 0) base[i] = { ...base[i], ...fiche, dateConst: base[i].dateConst || fiche.dateConst }; else base.unshift(fiche);
            sauvegarderBaseVehicules(base);
        }

        function noteDepuisBase(row) {
            return {
                id: row.id,
                client: row.client,
                codeClient: row.code_client,
                tel: row.tel,
                mail: row.mail,
                adresse: row.adresse,
                immat: row.immat,
                modele: row.modele,
                vin: row.vin,
                notes: row.notes,
                refs: row.refs,
                date: row.note_date,
                createdBy: row.created_by,
                createdByName: row.created_by_name,
                updatedBy: row.updated_by,
                updatedByName: row.updated_by_name
            };
        }

        async function chargerHistoriqueNotes() {
            if (!supabaseClient || !currentUser) return;
            const userId = currentUser.id;
            try {
                const { data, error } = await supabaseClient
                    .from('atelier_notes')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (error) throw error;
                if (!currentUser || currentUser.id !== userId) return;
                notesPartagees = data.map(noteDepuisBase);
                afficherHistoriqueNotes();
            } catch (error) {
                alert(`Impossible de charger les fiches partagées : ${error.message || 'erreur de connexion à la base de données.'}`);
            }
        }

        function afficherHistoriqueNotes() {
            const liste = notesPartagees;
            bnCountBadge.textContent = liste.length;
            $id('bn-notes-count-btn').textContent = liste.length;
            const q = bnFiltre.value.trim().toLowerCase();
            bnListeConteneur.innerHTML = '';

            const filtres = liste.filter(n => !q || [n.client, n.immat, n.codeClient, n.modele, n.notes, (n.refs || []).map(r => r.ref + ' ' + r.desig).join(' ')].join(' ').toLowerCase().includes(q));

            if (!filtres.length) {
                bnListeConteneur.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 24px 0;">Aucune note enregistrée pour l'instant.</div>`;
                return;
            }

            filtres.forEach(note => {
                const card = document.createElement('div');
                card.style.cssText = "background: rgba(10, 13, 20, 0.7); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;";
                const refs = note.refs || [], nb = k => refs.filter(r => r.st === k).length;
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                        <strong style="color: #fff; font-size: 13px;">${esc(note.client)}</strong>
                        <span style="font-size: 10px; color: var(--text-muted); white-space: nowrap;">${esc(note.date)}</span>
                    </div>
                    <div style="display: flex; gap: 8px; font-size: 11px; flex-wrap: wrap; align-items: center;">
                        ${note.immat !== '--' ? `<span style="font-family: monospace; font-weight: 700; color: #60a5fa; background: rgba(59, 130, 246, 0.15); padding: 2px 6px; border-radius: 4px;">${esc(note.immat)}</span>` : ''}
                        ${note.modele ? `<span style="color: var(--text-secondary);">${esc(note.modele)}</span>` : ''}
                        ${note.codeClient ? `<span style="color: #34d399; font-weight: 600;">Code: ${esc(note.codeClient)}</span>` : ''}
                        ${refs.length ? `<span style="color: var(--text-secondary);">📋 ${refs.length} réf. · 🏠 ${nb('stock')} · 🏭 ${nb('usine')} · ❌ ${nb('pasdispo')}</span>` : ''}
                    </div>
                    <div style="font-size: 10px; color: var(--text-muted);">
                        Créée par ${esc(note.createdByName || 'Utilisateur')}
                        ${note.updatedBy && note.updatedBy !== note.createdBy ? ` · Modifiée par ${esc(note.updatedByName || 'Utilisateur')}` : ''}
                    </div>
                    ${note.notes ? `<div style="font-size: 12px; color: var(--text-muted); white-space: pre-wrap; max-height: 40px; overflow: hidden; font-family: monospace;">${esc(note.notes)}</div>` : ''}
                    <div style="display: flex; justify-content: flex-end; gap: 6px; margin-top: 4px;">
                        <button class="btn btn-blue btn-charger-cette-note" style="padding: 3px 8px; font-size: 11px;">✏️ Charger / modifier</button>
                        <button class="btn btn-purple btn-imprimer-cette-note" style="padding: 3px 8px; font-size: 11px;">🖨️ Imprimer</button>
                        <button class="btn btn-glass btn-suppr-cette-note" style="padding: 3px 8px; font-size: 11px; color: #fb7185;">✕</button>
                    </div>
                `;

                card.querySelector('.btn-charger-cette-note').addEventListener('click', (e) => {
                    e.stopPropagation();
                    noteEnEditionId = note.id;
                    bnNomClient.value = note.client !== 'Client sans nom' ? note.client : '';
                    bnCodeClient.value = note.codeClient || '';
                    bnTelClient.value = note.tel || '';
                    $id('bn-mail-client').value = note.mail || ''; $id('bn-adresse-client').value = note.adresse || '';
                    bnImmat.value = note.immat !== '--' ? note.immat : '';
                    bnModele.value = note.modele || '';
                    bnVin.value = note.vin || '';
                    bnTexte.value = note.notes || '';
                    bnRefs = refs.map(r => ({ ...r, id: ++bnRefSeq })); renderBnRefs();
                    $id('btn-bn-sauvegarder').textContent = '💾 Mettre à jour la fiche';
                    fermerNotes();
                });

                card.querySelector('.btn-imprimer-cette-note').addEventListener('click', (e) => {
                    e.stopPropagation();
                    fermerNotes();
                    imprimerNote(note);
                });

                card.querySelector('.btn-suppr-cette-note').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (!confirm("Supprimer cette fiche de l’espace partagé ?")) return;
                    try {
                        const { error } = await supabaseClient.from('atelier_notes').delete().eq('id', note.id);
                        if (error) throw error;
                    } catch (error) {
                        alert(`Impossible de supprimer la fiche : ${error.message || 'erreur de connexion à la base de données.'}`);
                        return;
                    }
                    notesPartagees = notesPartagees.filter(item => item.id !== note.id);
                    if (noteEnEditionId === note.id) viderFormulaireBn();
                    afficherHistoriqueNotes();
                });

                bnListeConteneur.appendChild(card);
            });
        }

        bnFiltre.addEventListener('input', afficherHistoriqueNotes);

        document.getElementById('btn-bn-copier-recap').addEventListener('click', () => {
            const client = bnNomClient.value.trim() || 'Non renseigné';
            const code = bnCodeClient.value.trim() || '--';
            const tel = bnTelClient.value.trim() || '--';
            const immat = bnImmat.value.trim().toUpperCase() || '--';
            const modele = bnModele.value.trim() || '--';
            const vin = bnVin.value.trim().toUpperCase() || '--';
            const texte = bnTexte.value.trim();

            const recap = [
                `--- FICHE ATELIER / PIÈCES ---`,
                `Client : ${client} (Code: ${code}) | Tél: ${tel}`,
                `Mail : ${$id('bn-mail-client').value.trim() || '--'} | Adresse : ${$id('bn-adresse-client').value.trim() || '--'}`,
                `Véhicule : ${modele} | Immat: ${immat} | VIN: ${vin}`,
                `-------------------------------`,
                ...(bnRefs.length ? ['Références :', ...bnRefs.map(r => `• ${r.ref} x${r.qty}${r.desig ? ' - ' + r.desig : ''} → ${LIBELLE_ST[r.st] || 'à vérifier'}`), ''] : []),
                texte ? `Détail pièces / Notes :\n${texte}` : (bnRefs.length ? '' : `Aucune note saisie.`)
            ].join('\n');

            navigator.clipboard.writeText(recap).then(() => {
                alert("✓ Récapitulatif copié dans le presse-papier !");
            });
        });

        document.getElementById('btn-bn-vers-stock').addEventListener('click', () => {
            const immat = bnImmat.value.trim().toUpperCase();
            const modele = bnModele.value.trim();
            const vin = bnVin.value.trim().toUpperCase();

            if (immat || vin || modele) {
                appliquerInfosVehicule({
                    immat: immat || '--',
                    modele: modele || 'Non renseigné',
                    vin: vin || '--',
                    dateConst: '--'
                }, true);
            }

            ouvrirEcran('stock');
        });

        /* -------------------------------------------------------------------------
           SECTION 1 : VÉRIFICATEUR STOCK AVEC 2 ÉTAPES ET TRI DU BILAN FINAL
           ------------------------------------------------------------------------- */
        let listePieces = [];
        let fileIndexList = [];
        let currentStepPos = 0;
        let phaseActuelle = 1;

        const fileInput = document.getElementById('file-input');
        const dropZone = document.getElementById('drop-zone');

        document.getElementById('btn-select-file').addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
        dropZone.addEventListener('click', (e) => { if (!e.target.closest('#btn-demo')) fileInput.click(); });
        fileInput.addEventListener('change', (e) => { if (e.target.files.length) chargerFichier(e.target.files[0]); });

        ['dragenter', 'dragover'].forEach(evt => dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.add('dragover'); }));
        ['dragleave', 'drop'].forEach(evt => dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); }));
        dropZone.addEventListener('drop', (e) => { if (e.dataTransfer.files.length) chargerFichier(e.dataTransfer.files[0]); });

        document.getElementById('btn-demo').addEventListener('click', (e) => {
            e.stopPropagation();
            const demo = "921005FA0A\n1\nTUYAU CLIMATISATION\nE43033ZL0D\n1\nJAMBE SUSPENSION AVANT GAUCHE\n543201KA0B\n1\nTAMPON ELAST FIXAT JAMBE SUSPENSION\n540503NF0A\n2\nBUTOIR CAOUTCHOUC";
            document.getElementById('gass-status-text').textContent = "Exemple EPC chargé";
            lireContenuTexte(demo);
        });

        function chargerFichier(file) {
            document.getElementById('gass-status-text').textContent = file.name;
            const ext = file.name.split('.').pop().toLowerCase();
            const reader = new FileReader();

            if (ext === 'txt') {
                reader.onload = (e) => lireContenuTexte(e.target.result);
                reader.readAsText(file);
            } else if (['xlsx', 'xls', 'csv'].includes(ext) && typeof XLSX !== 'undefined') {
                reader.onload = (e) => {
                    const data = new Uint8Array(e.target.result);
                    const wb = XLSX.read(data, { type: 'array' });
                    const sheet = wb.Sheets[wb.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                    lireContenuExcel(rows);
                };
                reader.readAsArrayBuffer(file);
            } else {
                reader.onload = (e) => lireContenuTexte(e.target.result);
                reader.readAsText(file);
            }
        }

        /* ===== OUTILS COMMUNS ===== */
        function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
        function $id(id) { return document.getElementById(id); }
        function nbQty(v) { return Math.round(Math.abs(parseFloat(String(v ?? '').replace(',', '.')))) || 1; }
        function dateFichier() { return new Date().toISOString().slice(0, 10); }

        async function sauverFichier(nom, data) {
            try {
                const d = window.claude ? await window.claude.use('downloads') : null;
                if (d) { await d.save({ filename: nom, data }); return; }
            } catch (e) {
                if (e && e.code === 'declined') return;
                if (e && e.code === 'rejected_extension') { alert('Le format .' + nom.split('.').pop() + ' ne peut pas être téléchargé depuis la version publiée. Utilisez le fichier HTML en local pour cet export.'); return; }
            }
            const a = document.createElement('a');
            a.href = URL.createObjectURL(data instanceof Blob ? data : new Blob([data]));
            a.download = nom; a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        }

        function telecharger(nom, contenu, type) { return sauverFichier(nom, new Blob([contenu], { type: type + ';charset=utf-8' })); }

        function extraireDepuisLignes(rows) {
            const re = { ref: /part\s*(#|no|number|n°)|r[ée]f|^\s*pi[èe]ce/i, des: /part\s*name|d[ée]sign|libell|descr/i, qty: /^\s*(qty|quantity|qt[eé]|quantit)/i };
            let h = -1, col = { ref: 0, qty: 1, des: 2 };
            for (let i = 0; i < Math.min(rows.length, 40) && h < 0; i++) {
                const r = (rows[i] || []).map(c => String(c ?? ''));
                const ir = r.findIndex(c => re.ref.test(c));
                if (ir >= 0) { h = i; col = { ref: ir, qty: r.findIndex(c => re.qty.test(c)), des: r.findIndex(c => re.des.test(c)) }; }
            }
            return rows.slice(h + 1).map(r => {
                r = r || [];
                const ref = String(r[col.ref] ?? '').trim();
                return {
                    ref,
                    qty: col.qty >= 0 ? nbQty(r[col.qty]) : 1,
                    desig: (col.des >= 0 ? String(r[col.des] ?? '').trim() : '') || 'SANS DÉSIGNATION'
                };
            }).filter(p => p.ref && !/total/i.test(p.ref));
        }

        function parserTexte(texte) {
            const lignes = texte.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            if (lignes.some(l => l.includes(';') || l.includes('\t'))) return extraireDepuisLignes(lignes.map(l => l.split(/;|\t/)));
            const liste = [];
            for (let i = 0; i < lignes.length; i += 3) liste.push({ ref: lignes[i], qty: nbQty(lignes[i + 1]), desig: lignes[i + 2] || 'SANS DÉSIGNATION' });
            return liste;
        }

        function lireContenuTexte(texte) { demarrerVerification(parserTexte(texte)); }
        function lireContenuExcel(rows) { demarrerVerification(extraireDepuisLignes(rows)); }

        /* ===== VÉRIFICATEUR STOCK ===== */
        const LIB = { stock: '🏠 En Stock Magasin', nostock: '❌ Pas en stock', dispo: '✓ Dispo Usine', rupture: '✕ Rupture Usine', attente: '⏳ En attente' };
        const libTxt = s => LIB[s].replace(/^\S+\s/, '');
        const RANG = { stock: 0, dispo: 1, rupture: 2, nostock: 3, attente: 4 };
        const statut = p => p.stock === true ? 'stock' : p.stock === false ? (p.usine || 'nostock') : 'attente';
        const decide = p => phaseActuelle === 1 ? p.stock !== null : p.usine !== null;
        const pieceCourante = () => (phaseActuelle < 3 && listePieces.length) ? listePieces[fileIndexList[currentStepPos]] : null;
        const triees = () => listePieces.map(p => ({ p, s: statut(p) })).sort((a, b) => RANG[a.s] - RANG[b.s]);
        const montrer = (id, on) => $id(id).classList.toggle('hidden', !on);

        let ignorerCopie = false;
        function demarrerVerification(liste) {
            const l = liste.filter(p => p.ref);
            if (!l.length) { alert('Aucune pièce lisible dans ce fichier.'); return; }
            listePieces = l.map(p => ({ ...p, stock: null, usine: null }));
            phaseActuelle = 1;
            fileIndexList = listePieces.map((_, i) => i);
            currentStepPos = 0;
            dropZone.classList.add('compact');
            renderStock();
        }

        function renderStock() {
            const p1 = phaseActuelle === 1, actif = phaseActuelle < 3;
            montrer('step-phase-banner', actif); montrer('pas-a-pas-card', actif);
            montrer('kpi-section', true); montrer('table-card', true);
            montrer('action-btns-phase1', p1); montrer('action-btns-phase2', phaseActuelle === 2);
            $id('step-phase-banner').classList.toggle('phase-usine', !p1);
            $id('pas-a-pas-card').classList.toggle('theme-usine', !p1);
            $id('pas-tag-indicator').classList.toggle('tag-usine', !p1);
            $id('progress-bar').classList.toggle('bar-usine', !p1);
            if (actif) {
                $id('phase-badge-title').textContent = p1 ? '🏠 ÉTAPE 1 : VÉRIFICATION DU STOCK MAGASIN' : '🏭 ÉTAPE 2 : DISPONIBILITÉ USINE';
                $id('phase-badge-desc').textContent = p1 ? 'Indiquez si la pièce est présente dans votre stock local ou non.' : 'Pour les pièces absentes du magasin : disponible en usine ou en rupture ?';
                $id('pas-tag-indicator').textContent = p1 ? '1. Stock Magasin' : '2. Dispo Usine';
                $id('nav-hint-text').textContent = p1 ? 'Touche 1 = En Stock | Touche 2 = Pas en Stock' : 'Touche 1 = Dispo Usine | Touche 2 = Rupture Usine';
                const p = pieceCourante(), s = statut(p), n = fileIndexList.length;
                $id('current-ref').textContent = p.ref;
                $id('current-qty').textContent = p.qty;
                $id('current-desig').textContent = p.desig;
                $id('step-counter').textContent = `Pièce ${currentStepPos + 1} sur ${n}`;
                $id('progress-bar').style.width = Math.round(fileIndexList.filter(i => decide(listePieces[i])).length / n * 100) + '%';
                $id('current-status-badge').innerHTML = `<span class="badge-status st-${s}">${LIB[s]}</span>`;
                if ($id('auto-copy-check').checked && !ignorerCopie) copierRef();
            }
            const cnt = k => listePieces.filter(p => statut(p) === k).length;
            const total = listePieces.length, st = cnt('stock'), di = cnt('dispo'), ru = cnt('rupture');
            $id('kpi-total').textContent = total; $id('kpi-stock').textContent = st;
            $id('kpi-dispo').textContent = di; $id('kpi-rupture').textContent = ru;
            $id('kpi-attente').textContent = total - st - di - ru;
            $id('table-subtitle').textContent = (actif ? `${total - (total - st - di - ru)}/${total} pièces traitées` : 'Vérification terminée ✓') + ' · ✎ cliquez sur une référence ou une désignation pour la corriger';
            $id('table-body').innerHTML = triees().map(({ p, s }, i) => `<tr><td>${i + 1}</td><td class="td-ref" data-i="${listePieces.indexOf(p)}" title="Cliquer pour modifier" style="font-family:monospace;font-weight:700;">${esc(p.ref)}</td><td style="text-align:center;">${esc(p.qty)}</td><td class="td-desig" data-i="${listePieces.indexOf(p)}" title="Cliquer pour modifier">${esc(p.desig)}</td><td style="text-align:center;"><span class="badge-status st-${s}">${LIB[s]}</span></td></tr>`).join('');
        }

        function copierRef() {
            const p = pieceCourante(); if (!p || !navigator.clipboard) return;
            navigator.clipboard.writeText(p.ref).then(() => {
                const b = $id('btn-copy'), t = $id('btn-copy-text');
                b.classList.add('copied'); t.textContent = 'Copié !';
                setTimeout(() => { b.classList.remove('copied'); t.textContent = 'Copier la référence'; }, 1200);
            }).catch(() => {});
        }

        function finPhase() {
            const nonFait = fileIndexList.findIndex(i => !decide(listePieces[i]));
            if (nonFait >= 0) { currentStepPos = nonFait; return; }
            if (phaseActuelle === 1) {
                fileIndexList = listePieces.map((p, i) => p.stock === false ? i : -1).filter(i => i >= 0);
                currentStepPos = 0;
                phaseActuelle = fileIndexList.length ? 2 : 3;
            } else phaseActuelle = 3;
        }

        function avancer() {
            const avant = phaseActuelle;
            if (currentStepPos < fileIndexList.length - 1) currentStepPos++; else finPhase();
            renderStock();
            if (avant === 1 && phaseActuelle !== 1) afficherMessageEtape1();
        }

        function afficherMessageEtape1() {
            const enStock = listePieces.filter(p => p.stock === true).length, manquantes = fileIndexList.length;
            const pl = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');
            $id('etape-titre').textContent = 'Étape 1 terminée : stock magasin vérifié';
            $id('etape-texte').innerHTML = phaseActuelle === 2
                ? `<strong style="color:#60a5fa;">${pl(enStock, 'pièce')}</strong> en stock au magasin.<br><strong style="color:#fb7185;">${pl(manquantes, 'pièce')}</strong> absente${manquantes > 1 ? 's' : ''} du stock.<br><br>Passons à l'<strong>étape 2</strong> : vérification de la disponibilité usine pour les pièces manquantes.`
                : `Toutes les pièces (<strong style="color:#60a5fa;">${enStock}</strong>) sont en stock au magasin.<br><br>L'étape 2 (disponibilité usine) n'est pas nécessaire.`;
            $id('btn-etape-ok').textContent = phaseActuelle === 2 ? "Commencer l'étape 2 →" : 'Voir le récapitulatif';
            $id('modal-etape').classList.remove('hidden');
            $id('btn-etape-ok').focus();
        }
        $id('btn-etape-ok').addEventListener('click', () => $id('modal-etape').classList.add('hidden'));

        function decider(val) {
            const p = pieceCourante(); if (!p) return;
            if (phaseActuelle === 1) p.stock = val; else p.usine = val ? 'dispo' : 'rupture';
            avancer();
        }

        $id('btn-p1-stock').addEventListener('click', () => decider(true));
        $id('btn-p1-nostock').addEventListener('click', () => decider(false));
        $id('btn-p2-dispo').addEventListener('click', () => decider(true));
        $id('btn-p2-rupture').addEventListener('click', () => decider(false));
        $id('btn-prev').addEventListener('click', () => { if (currentStepPos > 0) { currentStepPos--; renderStock(); } });
        $id('btn-next').addEventListener('click', () => { if (pieceCourante()) avancer(); });
        $id('btn-copy').addEventListener('click', copierRef);
        function editerRefCourante() {
            const p = pieceCourante(), el = $id('current-ref'); if (!p || el.querySelector('input')) return;
            const inp = document.createElement('input');
            inp.type = 'text'; inp.value = p.ref; inp.className = 'ref-edit-input';
            el.textContent = ''; el.appendChild(inp); inp.focus(); inp.select();
            let fini = false;
            const fin = ok => { if (fini) return; fini = true; const v = inp.value.trim().toUpperCase(); if (ok && v) p.ref = v; renderStock(); };
            inp.addEventListener('keydown', e => { if (e.key === 'Enter') fin(true); else if (e.key === 'Escape') fin(false); });
            inp.addEventListener('blur', () => fin(true));
        }
        $id('btn-toggle-edit-ref').addEventListener('click', editerRefCourante);
        $id('current-ref').addEventListener('click', editerRefCourante);

        function editerCellule(td) {
            const champ = td.classList.contains('td-ref') ? 'ref' : 'desig', p = listePieces[Number(td.dataset.i)];
            if (!p || td.querySelector('input')) return;
            const inp = document.createElement('input');
            inp.type = 'text'; inp.value = p[champ]; inp.className = 'modal-input';
            if (champ === 'ref') inp.style.fontFamily = "'JetBrains Mono', monospace";
            td.classList.add('editing'); td.textContent = ''; td.appendChild(inp); inp.focus(); inp.select();
            let fini = false;
            const fin = ok => {
                if (fini) return; fini = true;
                const v = inp.value.trim();
                if (ok && v) p[champ] = champ === 'ref' ? v.toUpperCase() : v;
                ignorerCopie = true; renderStock(); ignorerCopie = false;
            };
            inp.addEventListener('keydown', e => { if (e.key === 'Enter') fin(true); else if (e.key === 'Escape') fin(false); });
            inp.addEventListener('blur', () => fin(true));
        }
        $id('table-body').addEventListener('click', e => { const td = e.target.closest('.td-ref, .td-desig'); if (td) editerCellule(td); });

        document.addEventListener('keydown', (e) => {
            if (!$id('screen-stock').classList.contains('active-screen') || !pieceCourante()) return;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            if (['modal-print', 'modal-db-veh', 'modal-etape', 'modal-notes'].some(m => !$id(m).classList.contains('hidden'))) return;
            if (e.key === '1') decider(true);
            else if (e.key === '2') decider(false);
            else if (e.key === 'ArrowLeft') $id('btn-prev').click();
            else if (e.key === 'ArrowRight') $id('btn-next').click();
        });

        /* Exports du bilan */
        const lignesExport = () => [['#', 'Référence', 'Quantité', 'Désignation', 'Statut'], ...triees().map(({ p, s }, i) => [i + 1, p.ref, p.qty, p.desig, libTxt(s)])];
        $id('btn-export-xlsx').addEventListener('click', () => {
            if (!listePieces.length) return;
            if (typeof XLSX === 'undefined') { alert('Librairie Excel non chargée (connexion internet requise).'); return; }
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(lignesExport()), 'Stock');
            sauverFichier(`verification_stock_${dateFichier()}.xlsx`, new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/octet-stream' }));
        });
        $id('btn-export-csv').addEventListener('click', () => {
            if (!listePieces.length) return;
            const csv = lignesExport().map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
            telecharger(`verification_stock_${dateFichier()}.csv`, '\ufeff' + csv, 'text/csv');
        });

        /* Impression */
        $id('btn-open-print-modal').addEventListener('click', () => $id('modal-print').classList.remove('hidden'));
        $id('btn-cancel-modal-print').addEventListener('click', () => $id('modal-print').classList.add('hidden'));
        $id('check-attribuer-garage').addEventListener('change', (e) => montrer('modal-garage-fields', e.target.checked));
        $id('btn-confirm-print').addEventListener('click', () => {
            reinitialiserImpressionStock();
            synchroniserDonneesVehicule(false);
            $id('print-date-display').textContent = new Date().toLocaleDateString('fr-FR');
            $id('print-veh-modele').textContent = infoVehicule.modele;
            $id('print-veh-immat').textContent = infoVehicule.immat;
            $id('print-veh-vin').textContent = infoVehicule.vin;
            $id('print-veh-date').textContent = infoVehicule.dateConst;
            const garage = $id('check-attribuer-garage').checked, comm = $id('input-comm-garage').value.trim();
            $id('print-card-garage').style.display = garage ? 'block' : 'none';
            $id('print-garage-nom').textContent = $id('input-nom-garage').value.trim() || '--';
            $id('print-garage-code').textContent = $id('input-code-client').value.trim() || '--';
            $id('print-row-comm').style.display = (garage && comm) ? 'flex' : 'none';
            $id('print-garage-comm').textContent = comm;
            $id('print-table-body').innerHTML = triees().map(({ p, s }, i) => `<tr><td>${i + 1}</td><td style="font-family:monospace;font-weight:700;">${esc(p.ref)}</td><td style="text-align:center;">${esc(p.qty)}</td><td>${esc(p.desig)}</td><td style="text-align:center;"><span class="print-st-badge">${libTxt(s)}</span></td></tr>`).join('');
            $id('modal-print').classList.add('hidden');
            setTimeout(() => window.print(), 150);
        });

        /* ===== CONVERTISSEURS NISSAN (GASS) & MG → DCSnet (logique d'origine Gemini) ===== */
        const CLE_CMD = 'dcsnet_last_cmd_num';
        const convertisseurs = [];
        const bornerCmd = n => { n = parseInt(n, 10); return (n >= 2000 && n <= 9999) ? n : 2000; };
        let numCmd = 2000;
        try { numCmd = bornerCmd(localStorage.getItem(CLE_CMD)); } catch (e) {}

        function definirCmd(n) {
            numCmd = bornerCmd(n);
            try { localStorage.setItem(CLE_CMD, numCmd); } catch (e) {}
            convertisseurs.forEach(c => c.rafraichir());
        }

        /* Lecture fichier GASS : on ne garde que les lignes « ZPN » */
        function parserNissan(texte) {
            const lignes = texte.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
            const res = [], lignesZPN = lignes.filter(l => /\bZPN\b/.test(l));
            if (lignesZPN.length > 0) {
                lignesZPN.forEach(ligne => {
                    const cols = (ligne.includes('\t') ? ligne.split('\t') : ligne.split(/\s{2,}/)).map(c => c.trim()).filter(c => c.length > 0);
                    const zpnIdx = cols.findIndex(c => c === 'ZPN');
                    if (zpnIdx !== -1 && cols[zpnIdx + 1]) {
                        const ref = cols[zpnIdx + 1], desig = cols[zpnIdx + 2] || 'PIECE NISSAN';
                        let qty = 1;
                        const eaIdx = cols.findIndex((c, idx) => idx > zpnIdx && c === 'EA');
                        if (eaIdx !== -1) {
                            const v = parseInt(cols[eaIdx - 2], 10) || parseFloat(cols[eaIdx - 1]);
                            if (!isNaN(v) && v > 0) qty = Math.round(v);
                        } else {
                            const i2 = cols.findIndex((c, idx) => idx > zpnIdx + 1 && c === ref);
                            if (i2 !== -1 && cols[i2 + 1]) { const v = parseInt(cols[i2 + 1], 10); if (!isNaN(v) && v > 0) qty = v; }
                        }
                        res.push({ ref, desig, qty });
                    }
                });
            } else {
                for (let i = 0; i < lignes.length; i += 3) if (lignes[i]) res.push({ ref: lignes[i], qty: parseInt(lignes[i + 1], 10) || 1, desig: lignes[i + 2] || 'PIECE NISSAN' });
            }
            return res;
        }

        /* Lecture facture MG (xlsx / csv) */
        function parserMatriceMG(rows) {
            const res = [];
            if (!rows || rows.length < 2) return res;
            let colPart = -1, colName = -1, colQty = -1, headerRowIdx = 0;
            for (let r = 0; r < Math.min(rows.length, 10); r++) {
                (rows[r] || []).forEach((cell, c) => {
                    const t = String(cell || '').trim().toLowerCase();
                    if (['part #', 'part#', 'part no', 'part_number'].includes(t)) colPart = c;
                    if (['part name', 'part_name', 'description', 'designation'].includes(t)) colName = c;
                    if (['qty', 'quantite', 'quantity'].includes(t)) colQty = c;
                });
                if (colPart !== -1 && colQty !== -1) { headerRowIdx = r; break; }
            }
            if (colPart === -1) colPart = 1;
            if (colName === -1) colName = 2;
            if (colQty === -1) colQty = 9;
            for (let r = headerRowIdx + 1; r < rows.length; r++) {
                const row = rows[r] || [], ref = String(row[colPart] || '').trim();
                if (!ref || ref.toLowerCase() === 'total' || ref.toLowerCase() === 'part #') continue;
                const desig = String(row[colName] || 'PIECE MG').replace(/[\r\n]+/g, ' ').replace(/;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 30);
                let q = parseInt(row[colQty], 10) || parseFloat(row[colQty]);
                if (isNaN(q) || q <= 0) q = 1;
                res.push({ ref, desig, qty: Math.round(q) });
            }
            return res;
        }
        function parserCSV_MG(texte) {
            return parserMatriceMG(texte.split(/\r?\n/).map(l => l.trim()).filter(l => l).map(l => l.split(l.includes(';') ? ';' : ',').map(c => c.replace(/^"|"$/g, '').trim())));
        }

        /* Construction des fichiers DCSnet */
        const TABS8 = '\t\t\t\t\t\t\t\t';
        function construireCSV(lignes, code, cmd, neg) {
            return lignes.map(it => `${code};${cmd};S;${it.ref};${it.desig};${neg ? -Math.abs(it.qty) : it.qty}`).join('\r\n');
        }
        function construireWFT(lignes, neg) {
            const entete = Array(18).fill('0' + TABS8).join('\r\n');
            const corps = lignes.map(it => 'X'.repeat(28) + String(neg ? -Math.abs(it.qty) : it.qty) + '    ' + it.ref.trim() + TABS8).join('\r\n');
            return entete + '\r\n' + corps;
        }

        function creerConvertisseur(I, defCode, prefixe, lecteurs, demoFn) {
            const $ = k => $id(I[k]);
            let pieces = [], verrou = null, timer;
            const codeFourn = () => ($('code').value.replace(/\D/g, '') || defCode).padStart(4, '0');
            const numAffiche = () => verrou !== null ? verrou : numCmd;

            function rafraichir() {
                $('cmd').value = numCmd;
                $('active').textContent = numCmd;
                if (!pieces.length) return;
                const neg = $('neg').checked;
                $('count').textContent = pieces.length;
                $('pcsv').textContent = construireCSV(pieces, codeFourn(), numAffiche(), neg);
                $('pwft').textContent = construireWFT(pieces, neg).replace(/\t/g, '→');
                [$('pcsv'), $('pwft')].forEach(b => { b.style.whiteSpace = 'pre'; b.style.overflowX = 'auto'; });
            }

            function definir(liste) {
                if (!liste.length) { alert('Aucune pièce lisible dans ce fichier.'); return; }
                pieces = liste; verrou = null;
                $('res').classList.remove('hidden');
                rafraichir();
            }

            async function exporter(types) {
                if (!pieces.length) return;
                const premier = verrou === null;
                verrou = numAffiche();
                const neg = $('neg').checked, base = `import_dcsnet_${prefixe}_${verrou}`;
                if (types.includes('csv')) await telecharger(base + '.csv', construireCSV(pieces, codeFourn(), verrou, neg), 'text/csv');
                if (types.includes('wft')) await telecharger(base + '.wft', construireWFT(pieces, neg), 'text/plain');
                if (premier && $('auto').checked) {
                    definirCmd(numCmd === 9999 ? 2000 : numCmd + 1);
                    $('toastNum').textContent = numCmd;
                    $('toast').classList.remove('hidden');
                    clearTimeout(timer);
                    timer = setTimeout(() => $('toast').classList.add('hidden'), 2800);
                }
            }

            function charger(file) {
                const ext = file.name.split('.').pop().toLowerCase(), r = new FileReader();
                if (lecteurs.lignes && (ext === 'xlsx' || ext === 'xls')) {
                    if (typeof XLSX === 'undefined') { alert('Librairie Excel non chargée (connexion internet requise).'); return; }
                    r.onload = e => {
                        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                        definir(lecteurs.lignes(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 })));
                    };
                    r.readAsArrayBuffer(file);
                } else {
                    r.onload = e => definir(lecteurs.texte(e.target.result));
                    r.readAsText(file);
                }
                if (I.titre) $('titre').textContent = 'Fichier : ' + file.name;
            }

            const recalcul = () => { verrou = null; rafraichir(); };
            $('minus').addEventListener('click', () => { definirCmd(numCmd === 2000 ? 9999 : numCmd - 1); recalcul(); });
            $('plus').addEventListener('click', () => { definirCmd(numCmd === 9999 ? 2000 : numCmd + 1); recalcul(); });
            $('cmd').addEventListener('input', () => { $('cmd').value = $('cmd').value.replace(/\D/g, '').slice(0, 4); });
            $('cmd').addEventListener('change', () => { definirCmd($('cmd').value); recalcul(); });
            $('code').addEventListener('input', () => { $('code').value = $('code').value.replace(/\D/g, '').slice(0, 4); rafraichir(); });
            $('neg').addEventListener('change', rafraichir);
            $('csv').addEventListener('click', () => exporter(['csv']));
            $('wft').addEventListener('click', () => exporter(['wft']));
            $('both').addEventListener('click', () => exporter(['csv', 'wft']));
            $('demo').addEventListener('click', (e) => { e.stopPropagation(); definir(demoFn()); });
            $('pick').addEventListener('click', (e) => { e.stopPropagation(); $('file').click(); });
            $('drop').addEventListener('click', (e) => { if (!e.target.closest('button')) $('file').click(); });
            $('file').addEventListener('change', (e) => { if (e.target.files.length) charger(e.target.files[0]); e.target.value = ''; });
            ['dragenter', 'dragover'].forEach(ev => $('drop').addEventListener(ev, (e) => { e.preventDefault(); $('drop').classList.add('dragover'); }));
            ['dragleave', 'drop'].forEach(ev => $('drop').addEventListener(ev, (e) => { e.preventDefault(); $('drop').classList.remove('dragover'); }));
            $('drop').addEventListener('drop', (e) => { if (e.dataTransfer.files.length) charger(e.dataTransfer.files[0]); });

            convertisseurs.push({ rafraichir });
            rafraichir();
        }

        creerConvertisseur({
            code: 'conv-code-fourn', cmd: 'conv-num-cmd', minus: 'btn-cmd-minus', plus: 'btn-cmd-plus', auto: 'conv-auto-next-file', neg: 'conv-neg-qty',
            toast: 'cmd-saved-toast', toastNum: 'toast-next-num', demo: 'btn-demo-conv', drop: 'drop-zone-conv', pick: 'btn-select-conv', file: 'file-input-conv',
            res: 'conv-results-card', count: 'conv-count', active: 'active-cmd-display', csv: 'btn-dl-csv', wft: 'btn-dl-wft', both: 'btn-dl-both',
            pcsv: 'preview-csv-box', pwft: 'preview-wft-box', titre: 'conv-drop-title'
        }, '9000', 'nissan', { texte: parserNissan }, () => {
            $id('conv-drop-title').textContent = 'Exemple GASS (ZPN) chargé';
            return parserNissan([
                "1201509402", "EUR", "1", "S580", "NFRD9310",
                "000001\t000000\tZPN\t260424CA0A\tSUPPORT PROJECTEUR DROIT\t503T\t0220180801\tsb Clt 353096\t000001\tZSO\t783044\t260424CA0A\t1\t1.000\tEA\t183.78",
                "000002\t000000\tZPN\t285334BA5C\tENJOLIVEUR SONAR\t503T\t0220180801\tsb Clt 353096\t000002\tZSO\t783044\t285334BA5C\t1\t1.000\tEA\t18.000"
            ].join('\n'));
        });

        creerConvertisseur({
            code: 'mg-code-fourn', cmd: 'mg-num-cmd', minus: 'btn-mg-minus', plus: 'btn-mg-plus', auto: 'mg-auto-next-file', neg: 'mg-neg-qty',
            toast: 'mg-saved-toast', toastNum: 'mg-toast-next-num', demo: 'btn-demo-mg', drop: 'drop-zone-mg', pick: 'btn-select-mg', file: 'file-input-mg',
            res: 'mg-results-card', count: 'mg-count', active: 'mg-active-cmd-display', csv: 'btn-mg-dl-csv', wft: 'btn-mg-dl-wft', both: 'btn-mg-dl-both',
            pcsv: 'preview-mg-csv-box', pwft: 'preview-mg-wft-box', titre: 'mg-drop-title'
        }, '6000', 'mg', { texte: parserCSV_MG, lignes: parserMatriceMG }, () => {
            $id('mg-drop-title').textContent = 'Exemple MG (Sales Invoice) chargé';
            return parserMatriceMG([
                ['Brand Name', 'Part #', 'Part Name', 'Processed Part #', 'Order #', 'Buyers Ref #', 'COO', 'Inbound HS Code', 'Outbound HS Code', 'QTY', 'MSRP'],
                ['MG', '10754438-SPRP', 'FASCIA-RR BPR UPR(PARE-CHOCS AR PARTIE SUPERIEURE)', '10754438-SPRP', '4ARENC126A087', 'N.302198', 'China', '8708109090', '', 1, 323.99],
                ['MG', '11026137', 'FASCIA-RR BPR LWR(PARE-CHOCS AR PARTIE INFERIEURE)', '11026137', '4ARENC126A087', 'N.302198', 'China', '8708109090', '', 1, 799.65],
                ['MG', '11026159', "COVER-RR TOW HOOK OPG(TRAPPE D'ANNEAU DE REMORQUAGE AR)", '11026159', '4ARENC126A087', 'N.302198', 'China', '8708109090', '', 1, 26.76],
                ['MG', '10639344-SPRP', "COVER-RR TOW HOOK OPG(TRAPPE D'ANNEAU DE REMORQUAGE AR)", '10639344-SPRP', '4ARENC126A087', 'N.302198', 'China', '8708109090', '', 1, 7.16]
            ]);
        });

        /* ===== BASE CLIENTS DCSnet : recherche automatique par nom ou code ===== */
        let CLIENTS = [], CLIENTS_IDX = [];
        const normTxt = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const nomClient = c => (c[1] + ' ' + c[2]).trim();
        const adresseClient = c => [c[6], [c[7], c[8]].filter(Boolean).join(' ')].filter(Boolean).join(', ');
        function formaterTel(t) { const d = String(t || '').replace(/[^\d+]/g, ''); return /^0\d{9}$/.test(d) ? d.replace(/(\d{2})(?=\d)/g, '$1 ') : String(t || '').trim(); }

        function indexerClients(liste, origine) {
            CLIENTS = liste; CLIENTS_IDX = liste.map(c => normTxt(nomClient(c)));
            $id('clients-status').textContent = liste.length.toLocaleString('fr-FR') + ' comptes · ' + origine;
        }

        function chercherClients(q, mode) {
            if (mode === 'code') {
                const d = q.replace(/\D/g, ''); if (d.length < 2) return [];
                return CLIENTS.filter(c => c[0].startsWith(d)).sort((a, b) => a[0].length - b[0].length || a[0].localeCompare(b[0])).slice(0, 8);
            }
            const nq = normTxt(q).trim(), t = nq.split(/\s+/).filter(Boolean); if (nq.length < 2) return [];
            const sc = [];
            for (let i = 0; i < CLIENTS.length; i++) {
                const s = CLIENTS_IDX[i];
                if (t.every(x => s.includes(x))) sc.push([(s.startsWith(t[0]) ? 0 : 4) + (CLIENTS[i][9] === 0 ? 0 : 2) + (CLIENTS[i][3] === 'S' ? 0 : 1), CLIENTS[i]]);
            }
            return sc.sort((a, b) => a[0] - b[0]).slice(0, 8).map(x => x[1]);
        }

        let csItems = [], csSel = -1, csPick = null;
        const csBox = $id('client-suggest');
        function fermerSuggestions() { csBox.style.display = 'none'; csItems = []; csSel = -1; }
        function rendreSuggestions(input) {
            csBox.innerHTML = csItems.map((c, i) => `<div class="cs-item${i === csSel ? ' on' : ''}" data-i="${i}"><div class="cs-top"><span>${esc(nomClient(c))}</span><span class="cs-code">${esc(c[0])}</span></div><div class="cs-sub">${esc([c[8], formaterTel(c[4]), c[5]].filter(Boolean).join(' · ') || '—')}</div></div>`).join('');
            const r = input.getBoundingClientRect(), w = Math.max(r.width, 360);
            csBox.style.width = w + 'px'; csBox.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 12)) + 'px'; csBox.style.top = (r.bottom + 6) + 'px';
            csBox.style.display = 'block';
        }
        function attacherSuggestionsClients(input, mode, onPick) {
            const choisir = i => { const c = csItems[i]; if (c) { fermerSuggestions(); onPick(c); } };
            input.addEventListener('input', () => {
                csPick = choisir; csItems = chercherClients(input.value, mode); csSel = -1;
                csItems.length ? rendreSuggestions(input) : fermerSuggestions();
            });
            input.addEventListener('keydown', e => {
                if (csBox.style.display !== 'block' || !csItems.length) return;
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); csSel = (csSel + (e.key === 'ArrowDown' ? 1 : -1) + csItems.length) % csItems.length; rendreSuggestions(input); }
                else if (e.key === 'Enter' && csSel >= 0) { e.preventDefault(); choisir(csSel); }
                else if (e.key === 'Escape') fermerSuggestions();
            });
            input.addEventListener('blur', () => setTimeout(fermerSuggestions, 150));
        }
        csBox.addEventListener('mousedown', e => { const it = e.target.closest('.cs-item'); if (it && csPick) { e.preventDefault(); csPick(Number(it.dataset.i)); } });
        window.addEventListener('scroll', fermerSuggestions, true);

        function remplirDepuisClient(c) {
            $id('bn-nom-client').value = nomClient(c); $id('bn-code-client').value = c[0];
            $id('bn-tel-client').value = formaterTel(c[4]); $id('bn-mail-client').value = c[5]; $id('bn-adresse-client').value = adresseClient(c);
        }
        attacherSuggestionsClients($id('bn-nom-client'), 'nom', remplirDepuisClient);
        attacherSuggestionsClients($id('bn-code-client'), 'code', remplirDepuisClient);
        const pickImpression = c => { $id('input-nom-garage').value = nomClient(c); $id('input-code-client').value = c[0]; };
        attacherSuggestionsClients($id('input-nom-garage'), 'nom', pickImpression);
        attacherSuggestionsClients($id('input-code-client'), 'code', pickImpression);

        /* Import et recherche dans l’annuaire client partagé */
        function parserCSV(txt, sep = ';') {
            const rows = []; let row = [], f = '', q = false;
            for (let i = 0; i < txt.length; i++) {
                const ch = txt[i];
                if (q) { if (ch === '"') { if (txt[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
                else if (ch === '"') q = true;
                else if (ch === sep) { row.push(f); f = ''; }
                else if (ch === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
                else if (ch !== '\r') f += ch;
            }
            if (f || row.length) { row.push(f); rows.push(row); }
            return rows;
        }
        function clientsDepuisCSV(buf) {
            let txt; try { txt = new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch (e) { txt = new TextDecoder('windows-1252').decode(buf); }
            const rows = parserCSV(txt), h = rows[0].map(normTxt), ix = n => h.indexOf(normTxt(n));
            const I = { cpt: ix('Compte'), col: ix('Collectif'), ty: ix('Particulier ou Société'), nom: ix('Nom client'), pre: ix('Prénom client'), cp: ix('Code postal client'), vil: ix('Commune client'), adr: ix('Adresse client'), con: ix('Contact client'), tel: ix('Téléphone professionnel client'), mail: ix('Mail client') };
            if (I.cpt < 0 || I.nom < 0) throw new Error('Colonnes « Compte » / « Nom client » introuvables');
            const g = (r, k) => (I[k] >= 0 ? (r[I[k]] || '').trim() : '');
            return rows.slice(1).filter(r => g(r, 'cpt')).map(r => [g(r, 'cpt'), g(r, 'nom'), g(r, 'pre'), g(r, 'ty'), g(r, 'tel') || g(r, 'con'), g(r, 'mail').replace(/\s+/g, ''), g(r, 'adr'), g(r, 'cp'), g(r, 'vil'), parseInt(g(r, 'col'), 10) || 0]);
        }
        $id('btn-import-clients').addEventListener('click', () => $id('file-import-clients').click());
        $id('file-import-clients').addEventListener('change', async (e) => {
            const f = e.target.files[0]; if (!f) return;
            try {
                const liste = clientsDepuisCSV(await f.arrayBuffer());
                if (!liste.length) throw new Error('Aucun client trouvé dans ce fichier');
                if (!supabaseClient || !currentUser) throw new Error('Connecte-toi avant de mettre à jour l’annuaire partagé.');
                const date = new Date().toLocaleDateString('fr-FR');
                const { error } = await supabaseClient
                    .from('atelier_client_directory')
                    .upsert({ id: 'shared', clients: liste });
                if (error) throw error;
                indexerClients(liste, 'partagée · mise à jour le ' + date);
                alert('✅ ' + liste.length.toLocaleString('fr-FR') + ' comptes clients importés.');
            } catch (err) { alert('Import impossible : ' + err.message); }
            e.target.value = '';
        });

        async function chargerClientsPartages() {
            if (!supabaseClient || !currentUser) return;
            const userId = currentUser.id;
            $id('clients-status').textContent = 'chargement de la base partagée…';
            try {
                const { data, error } = await supabaseClient
                    .from('atelier_client_directory')
                    .select('clients, updated_at')
                    .eq('id', 'shared')
                    .maybeSingle();
                if (error) throw error;
                if (!currentUser || currentUser.id !== userId) return;
                if (!data) {
                    indexerClients([], 'base partagée vide · importez le CSV DCSnet');
                    return;
                }
                if (!Array.isArray(data.clients)) throw new Error('Le contenu de la base clients est invalide.');
                const date = new Date(data.updated_at).toLocaleDateString('fr-FR');
                indexerClients(data.clients, 'base partagée · mise à jour le ' + date);
            } catch (error) {
                CLIENTS = [];
                CLIENTS_IDX = [];
                $id('clients-status').textContent = 'erreur de chargement';
                alert(`Impossible de charger l’annuaire client partagé : ${error.message || 'erreur de connexion à la base de données.'}`);
            }
        }

        /* ---- Popup « Notes enregistrées » + impression d'une note ---- */
        const modalNotes = $id('modal-notes');
        function ouvrirNotes() { chargerHistoriqueNotes(); modalNotes.classList.remove('hidden'); bnFiltre.focus(); }
        function fermerNotes() { modalNotes.classList.add('hidden'); }
        $id('btn-bn-ouvrir-notes').addEventListener('click', ouvrirNotes);
        $id('btn-fermer-notes').addEventListener('click', fermerNotes);
        modalNotes.addEventListener('mousedown', e => { if (e.target === modalNotes) fermerNotes(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') fermerNotes(); });

        function reinitialiserImpressionStock() {
            $id('print-sous-titre').textContent = 'Magasin Pièces de Rechange & Atelier — Fiche de Contrôle Disponibilité';
            $id('print-card-garage-title').textContent = 'Attribution Garage / Client';
            ['print-row-tel', 'print-row-mail', 'print-row-adr', 'print-notes-bloc'].forEach(i => { $id(i).style.display = 'none'; });
            $id('print-row-date').style.display = '';
            document.querySelector('.print-table').style.display = '';
        }

        const LIB_PRINT = { stock: 'En stock', usine: 'Dispo usine', pasdispo: 'Pas dispo' };
        function noteDepuisFormulaire() {
            return {
                client: bnNomClient.value.trim(), codeClient: bnCodeClient.value.trim(), tel: bnTelClient.value.trim(),
                mail: $id('bn-mail-client').value.trim(), adresse: $id('bn-adresse-client').value.trim(),
                immat: bnImmat.value.trim().toUpperCase(), modele: bnModele.value.trim(), vin: bnVin.value.trim().toUpperCase(),
                notes: bnTexte.value.trim(), refs: bnRefs.map(({ ref, qty, desig, st }) => ({ ref, qty, desig, st }))
            };
        }

        function imprimerNote(n) {
            const refs = n.refs || [], immat = (n.immat && n.immat !== '--') ? n.immat : '';
            const client = (n.client && n.client !== 'Client sans nom') ? n.client : '';
            if (!client && !immat && !n.notes && !refs.length) { alert('La note est vide : rien à imprimer.'); return; }
            reinitialiserImpressionStock();
            $id('print-sous-titre').textContent = 'Magasin Pièces de Rechange & Atelier — Fiche Client & Commande Pièces';
            $id('print-date-display').textContent = new Date().toLocaleDateString('fr-FR');
            $id('print-veh-modele').textContent = n.modele || '--';
            $id('print-veh-immat').textContent = immat || '--';
            $id('print-veh-vin').textContent = n.vin || '--';
            $id('print-row-date').style.display = 'none';
            $id('print-card-garage-title').textContent = 'Client / Garage';
            $id('print-card-garage').style.display = 'block';
            $id('print-garage-nom').textContent = client || '--';
            $id('print-garage-code').textContent = n.codeClient || '--';
            $id('print-row-comm').style.display = 'none';
            [['tel', n.tel], ['mail', n.mail], ['adr', n.adresse]].forEach(([k, v]) => {
                $id('print-garage-' + k).textContent = v || '--';
                $id('print-row-' + k).style.display = v ? '' : 'none';
            });
            document.querySelector('.print-table').style.display = refs.length ? '' : 'none';
            $id('print-table-body').innerHTML = refs.map((r, i) => `<tr><td>${i + 1}</td><td style="font-family:monospace;font-weight:700;">${esc(r.ref)}</td><td style="text-align:center;">${esc(r.qty)}</td><td>${esc(r.desig)}</td><td style="text-align:center;"><span class="print-st-badge">${LIB_PRINT[r.st] || 'À vérifier'}</span></td></tr>`).join('');
            $id('print-notes-text').textContent = n.notes || '';
            $id('print-notes-bloc').style.display = n.notes ? 'block' : 'none';
            setTimeout(() => window.print(), 150);
        }
        $id('btn-bn-imprimer').addEventListener('click', () => imprimerNote(noteDepuisFormulaire()));

        /* ---- Menu rapide (liste déroulante personnalisée) ---- */
        const ECRANS_MENU = [
            ['hub', "Accueil Portail", '#e2e8f0', "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m3 11 9-8 9 8\"/><path d=\"M5 10v10h14V10\"/><path d=\"M10 20v-6h4v6\"/></svg>"],
            ['stock', "Vérificateur Stock (2 Étapes)", '#ff4d6d', "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 8 12 3 3 8v8l9 5 9-5V8z\"/><path d=\"m3 8 9 5 9-5M12 13v8\"/></svg>"],
            ['blocnote', "Bloc-Notes Atelier & Client", '#34d399', "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z\"/><path d=\"M14 3v5h5M9 13h6M9 17h4\"/></svg>"],
            ['convertisseur', "Convertisseur GASS Nissan", '#60a5fa', "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m17 3 4 4-4 4\"/><path d=\"M3 11V9a2 2 0 0 1 2-2h16\"/><path d=\"m7 21-4-4 4-4\"/><path d=\"M21 13v2a2 2 0 0 1-2 2H3\"/></svg>"],
            ['conv-mg', "Convertisseur MG (.xlsx)", '#fb923c', "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2\"/><circle cx=\"7\" cy=\"17\" r=\"2\"/><circle cx=\"17\" cy=\"17\" r=\"2\"/><path d=\"M9 17h6\"/></svg>"]
        ];
        const qsEl = $id('qs'), qsMenu = $id('qs-menu');
        qsMenu.innerHTML = ECRANS_MENU.map(([k, l, c, ico]) => `<button type="button" class="qs-item" role="option" data-ecran="${k}" style="--c:${c}"><span class="qs-ico" style="--c:${c}">${ico}</span><span>${esc(l)}</span></button>`).join('');
        function majMenuRapide(nom) {
            const e = ECRANS_MENU.find(x => x[0] === nom) || ECRANS_MENU[0];
            $id('qs-label').textContent = e[1];
            $id('qs-ico').innerHTML = e[3];
            $id('qs-ico').style.setProperty('--c', e[2]);
            qsMenu.querySelectorAll('.qs-item').forEach(b => b.classList.toggle('active', b.dataset.ecran === e[0]));
        }
        function fermerMenuRapide() { qsEl.classList.remove('open'); $id('qs-btn').setAttribute('aria-expanded', 'false'); }
        $id('qs-btn').addEventListener('click', (e) => { e.stopPropagation(); const o = qsEl.classList.toggle('open'); $id('qs-btn').setAttribute('aria-expanded', o); });
        qsMenu.addEventListener('click', (e) => { const b = e.target.closest('.qs-item'); if (b) { fermerMenuRapide(); ouvrirEcran(b.dataset.ecran); } });
        document.addEventListener('click', (e) => { if (!qsEl.contains(e.target)) fermerMenuRapide(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermerMenuRapide(); });

        ouvrirEcran('hub');

        const boutonImporterNotesLocales = $id('btn-bn-import-local');
        boutonImporterNotesLocales.addEventListener('click', importerNotesLocales);

        function nombreNotesLocales() {
            const brut = localStorage.getItem(STORAGE_KEY_NOTES);
            if (!brut) return 0;
            const liste = JSON.parse(brut);
            if (!Array.isArray(liste)) throw new Error('Les anciennes fiches locales ne sont pas dans un format reconnu.');
            return liste.length;
        }

        function actualiserBoutonImportNotes() {
            try {
                const count = nombreNotesLocales();
                boutonImporterNotesLocales.classList.toggle('hidden', count === 0);
                boutonImporterNotesLocales.textContent = `⬆ Importer ${count} ancienne${count > 1 ? 's' : ''} fiche${count > 1 ? 's' : ''}`;
            } catch (error) {
                boutonImporterNotesLocales.classList.remove('hidden');
                boutonImporterNotesLocales.textContent = '⬆ Importer anciennes fiches';
                boutonImporterNotesLocales.title = error.message;
            }
        }

        async function importerNotesLocales() {
            let anciennesNotes;
            try {
                const brut = localStorage.getItem(STORAGE_KEY_NOTES);
                anciennesNotes = brut ? JSON.parse(brut) : [];
                if (!Array.isArray(anciennesNotes)) throw new Error('Les anciennes fiches locales ne sont pas dans un format reconnu.');
            } catch (error) {
                alert(`Impossible de lire les anciennes fiches : ${error.message}`);
                return;
            }
            if (!anciennesNotes.length) {
                actualiserBoutonImportNotes();
                return;
            }
            if (!supabaseClient || !currentUser) {
                alert('Connecte-toi avant d’importer les fiches locales.');
                return;
            }
            if (!confirm(`${anciennesNotes.length} fiche(s) de ce navigateur seront ajoutées à l’espace partagé. Continuer ?`)) return;

            let deviceId = localStorage.getItem(STORAGE_KEY_MIGRATION_DEVICE);
            if (!deviceId) {
                if (!window.crypto || !window.crypto.randomUUID) {
                    alert('L’import nécessite un navigateur récent et une connexion sécurisée (HTTPS).');
                    return;
                }
                deviceId = window.crypto.randomUUID();
                localStorage.setItem(STORAGE_KEY_MIGRATION_DEVICE, deviceId);
            }

            const now = new Date().toLocaleDateString('fr-FR');
            const lignes = anciennesNotes.map((note, index) => ({
                client: String(note.client || 'Client sans nom'),
                code_client: String(note.codeClient || ''),
                tel: String(note.tel || ''),
                mail: String(note.mail || ''),
                adresse: String(note.adresse || ''),
                immat: String(note.immat || '--'),
                modele: String(note.modele || ''),
                vin: String(note.vin || ''),
                notes: String(note.notes || ''),
                refs: Array.isArray(note.refs) ? note.refs : [],
                note_date: String(note.date || now),
                legacy_key: `${deviceId}:${String(note.id === undefined ? index : note.id)}`
            }));

            boutonImporterNotesLocales.disabled = true;
            try {
                const { error } = await supabaseClient
                    .from('atelier_notes')
                    .upsert(lignes, { onConflict: 'legacy_key', ignoreDuplicates: true });
                if (error) throw error;
            } catch (error) {
                alert(`L’import a échoué. Les fiches locales sont conservées : ${error.message || 'erreur de connexion à la base de données.'}`);
                return;
            } finally {
                boutonImporterNotesLocales.disabled = false;
            }
            await chargerHistoriqueNotes();
            boutonImporterNotesLocales.classList.add('hidden');
            alert('Import terminé. Les fiches locales sont conservées dans ce navigateur.');
        }

        const authGate = $id('auth-gate');
        const authForm = $id('auth-form');
        const authNameField = $id('auth-name-field');
        const authNameInput = $id('auth-name');
        const authEmailInput = $id('auth-email');
        const authPasswordInput = $id('auth-password');
        const authSubmit = $id('auth-submit');
        const authToggleMode = $id('auth-toggle-mode');
        const authStatus = $id('auth-status');
        const authSetupMessage = $id('auth-setup-message');
        const accountControls = $id('account-controls');
        const realtimeStatus = $id('realtime-status');
        let modeInscription = false;

        function afficherStatutAuth(message, estErreur = false) {
            authStatus.textContent = message;
            authStatus.classList.toggle('error', estErreur);
        }

        function mettreAJourSession(session) {
            const nextUser = session ? session.user : null;
            const userChanged = currentUser && nextUser && currentUser.id !== nextUser.id;
            if (userChanged) {
                notesPartagees = [];
                CLIENTS = [];
                CLIENTS_IDX = [];
                if (notesChannel) {
                    supabaseClient.removeChannel(notesChannel);
                    notesChannel = null;
                }
            }
            currentUser = nextUser;
            const connecte = Boolean(currentUser);
            authGate.classList.toggle('hidden', connecte);
            accountControls.classList.toggle('hidden', !connecte);
            document.querySelectorAll('body > header, body > main, body > footer').forEach(element => {
                if (connecte) element.removeAttribute('inert');
                else element.setAttribute('inert', '');
            });

            if (connecte) {
                const nom = currentUser.user_metadata && currentUser.user_metadata.full_name;
                $id('account-user-name').textContent = nom || currentUser.email;
                actualiserBoutonImportNotes();
                void chargerHistoriqueNotes();
                void chargerClientsPartages();
                if (!notesChannel) {
                    notesChannel = supabaseClient
                        .channel('atelier-notes-team')
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'atelier_notes' }, () => {
                            void chargerHistoriqueNotes();
                        })
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'atelier_client_directory' }, () => {
                            void chargerClientsPartages();
                        })
                        .subscribe(status => {
                            const indisponible = status === 'CHANNEL_ERROR' || status === 'TIMED_OUT';
                            realtimeStatus.textContent = indisponible
                                ? 'Synchronisation en direct indisponible — rouvre « Notes enregistrées » pour actualiser.'
                                : '';
                            realtimeStatus.classList.toggle('hidden', !indisponible);
                        });
                }
                return;
            }

            notesPartagees = [];
            CLIENTS = [];
            CLIENTS_IDX = [];
            $id('clients-status').textContent = 'connecte-toi pour charger la base partagée';
            afficherHistoriqueNotes();
            if (notesChannel) {
                supabaseClient.removeChannel(notesChannel);
                notesChannel = null;
            }
        }

        authToggleMode.addEventListener('click', () => {
            modeInscription = !modeInscription;
            authNameField.classList.toggle('hidden', !modeInscription);
            authNameInput.required = modeInscription;
            authPasswordInput.autocomplete = modeInscription ? 'new-password' : 'current-password';
            authSubmit.textContent = modeInscription ? 'Créer mon compte' : 'Se connecter';
            authToggleMode.textContent = modeInscription ? 'J’ai déjà un compte' : 'Créer un compte';
            afficherStatutAuth('');
        });

        authForm.addEventListener('submit', async event => {
            event.preventDefault();
            const email = authEmailInput.value.trim().toLowerCase();
            const password = authPasswordInput.value;
            const fullName = authNameInput.value.trim();

            if (modeInscription && !email.endsWith(DOMAINE_EMAIL_AUTORISE)) {
                afficherStatutAuth(`Utilise ton adresse professionnelle ${DOMAINE_EMAIL_AUTORISE}.`, true);
                return;
            }
            if (modeInscription && !fullName) {
                afficherStatutAuth('Indique ton nom pour identifier les fiches créées.', true);
                return;
            }

            authSubmit.disabled = true;
            afficherStatutAuth(modeInscription ? 'Création du compte…' : 'Connexion…');
            try {
                const result = modeInscription
                    ? await supabaseClient.auth.signUp({
                        email,
                        password,
                        options: {
                            data: { full_name: fullName },
                            emailRedirectTo: new URL('.', window.location.href).href
                        }
                    })
                    : await supabaseClient.auth.signInWithPassword({ email, password });
                if (result.error) throw result.error;
                if (modeInscription && !result.data.session) {
                    afficherStatutAuth('Compte créé. Consulte ta boîte e-mail pour confirmer l’adresse avant de te connecter.');
                } else {
                    afficherStatutAuth('');
                }
            } catch (error) {
                afficherStatutAuth(error.message || 'La demande de connexion a échoué.', true);
            } finally {
                authSubmit.disabled = false;
            }
        });

        $id('btn-logout').addEventListener('click', async () => {
            try {
                const { error } = await supabaseClient.auth.signOut();
                if (error) throw error;
            } catch (error) {
                afficherStatutAuth(`Déconnexion impossible : ${error.message || 'erreur de connexion.'}`, true);
            }
        });

        async function initialiserAuthentification() {
            if (!window.supabase || !window.supabase.createClient || !SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
                authSetupMessage.textContent = 'Configuration Supabase manquante. Renseigne l’URL du projet et la clé anon/public dans supabase-config.js, puis exécute supabase-schema.sql dans Supabase.';
                authSetupMessage.classList.remove('hidden');
                authSubmit.disabled = true;
                authToggleMode.disabled = true;
                return;
            }
            const secureHost = window.location.protocol === 'https:' ||
                (window.location.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(window.location.hostname));
            if (!secureHost) {
                authSetupMessage.textContent = 'Pour partager les comptes et les données, héberge le portail sur une adresse HTTPS de l’entreprise. Ne lance pas index.html par double-clic.';
                authSetupMessage.classList.remove('hidden');
                authSubmit.disabled = true;
                authToggleMode.disabled = true;
                return;
            }

            supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
                auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
            });
            supabaseClient.auth.onAuthStateChange((_event, session) => mettreAJourSession(session));
            const { data, error } = await supabaseClient.auth.getSession();
            if (error) {
                afficherStatutAuth(`Impossible de vérifier la session : ${error.message}`, true);
                return;
            }
            mettreAJourSession(data.session);
        }

        initialiserAuthentification();
    
