'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Calculator, FileText, TrendingUp, Download, Factory, Building2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';

// Types pour le simulateur TPME
interface TPMEProjectData {
  // Secteur d'activité
  secteurType: 'manufacturier' | 'touristique' | '';
  ratioMinRequis: number; // 1.5 pour manufacturier, 1 pour touristique

  // Investissement
  montantInvestissement: number;
  secteurActivite: string;
  secteurActiviteAutre?: string; // Pour saisie manuelle si "autre"
  fondsPropresPct: number;

  // CAPEX - Ventilation du montant d'investissement
  fraisEtude: number;
  foncierPrive: number;
  foncierPublic: number;
  constructions: number;
  equipements: number;

  // Emplois
  emploisStablesCreus: number;

  // Localisation
  region: string;
  province: string;

  // Activités prioritaires (automatique selon secteur)
  activitePrioritaire: boolean;
}

interface TPMESimulationResult {
  montantPrimable: number;
  primeEmplois: number;
  primeTerritoriale: number;
  primeSectorielle: number;
  totalPrimesPct: number;
  totalPrimesAjustePct: number;
  montantPrimesMAD: number;
  eligible: boolean;
  raisonNonEligibilite?: string;
}

// Secteurs éligibles TPME
const SECTEURS_TPME = [
  { value: 'tourisme-loisir', label: 'Tourisme et loisir', prioritaire: true },
  { value: 'industrie', label: 'Industrie', prioritaire: true },
  { value: 'logistique', label: 'Logistique', prioritaire: true },
  { value: 'industrie-culturelle', label: 'Industrie culturelle', prioritaire: true },
  { value: 'numerique', label: 'Numérique', prioritaire: true },
  { value: 'transport', label: 'Transport', prioritaire: true },
  { value: 'outsourcing', label: 'Outsourcing', prioritaire: true },
  { value: 'aquaculture', label: 'Aquaculture', prioritaire: true },
  { value: 'energie-renouvelable', label: 'Energie renouvelable', prioritaire: true },
  { value: 'transformation-dechets', label: 'Transformation et valorisation des déchets', prioritaire: true },
  { value: 'artisanat', label: 'Artisanat', prioritaire: true },
  { value: 'autre', label: 'Autre (non prioritaire)', prioritaire: false }
];

// Provinces par catégorie (harmonisées avec le simulateur principal)
const PROVINCES_CATEGORIE_A = [
  'Larache', 'M\'diq-Fnideq', 'Ouazzane', 'Tétouan', 'Chefchaouen',
  'Nador', 'Berkane', 'Sefrou', 'Boulemane', 'Taza', 'Fès', 'Meknès',
  'El Hajeb', 'Ifrane', 'Sidi Slimane', 'Khemisset', 'Sidi Kacem', 'Salé',
  'Beni Mellal', 'Khénifra', 'Khouribga', 'Fquih Ben Salah', 'Sidi Bennour',
  'Safi', 'Youssoufia', 'Al Haouz', 'Kelaa Sraghna', 'Essaouira', 'Rhamna',
  'Chichaoua', 'Ouarzazate', 'Taroudant', 'Chtouka Aït Baha', 'Inezgane Aït Melloul',
  'Laâyoune', 'Oued Eddahab'
];

const PROVINCES_CATEGORIE_B = [
  'Al Hoceima', 'Taourirt', 'Driouch', 'Jerada', 'Guercif', 'Oujda-Angad',
  'Figuig', 'Moulay Yacoub', 'Taounate', 'Azilal', 'Errachidia', 'Midelt',
  'Tinghir', 'Zagora', 'Tata', 'Tiznit', 'Sidi Ifni', 'Guelmim', 'Assa Zag',
  'Tan-Tan', 'Boujdour', 'Tarfaya', 'Es-Semara', 'Aousserd'
];

// Régions et leurs provinces
const REGIONS_PROVINCES_TPME = {
  'Tanger-Tétouan-Al Hoceima': ['Tanger-Assilah', 'Tétouan', 'Al Hoceima', 'Chefchaouen', 'Fahs-Anjra', 'Larache', 'Ouezzane'],
  'L\'Oriental': ['Oujda-Angad', 'Nador', 'Driouch', 'Jerada', 'Berkane', 'Taourirt', 'Figuig', 'Guercif'],
  'Fès-Meknès': ['Fès', 'Meknès', 'El Hajeb', 'Ifrane', 'Moulay Yacoub', 'Sefrou', 'Boulemane', 'Taounate', 'Taza'],
  'Rabat-Salé-Kénitra': ['Rabat', 'Salé', 'Skhirate-Témara', 'Kénitra', 'Khemisset', 'Sidi Kacem', 'Sidi Slimane'],
  'Béni Mellal-Khénifra': ['Béni Mellal', 'Azilal', 'Fquih Ben Salah', 'Khénifra', 'Khouribga'],
  'Casablanca-Settat': ['Casablanca', 'Fada H-Gourrama', 'El Jadida', 'Nouaceur', 'Médiouna', 'Mohammadia', 'Settat', 'Sidi Bennour', 'Berrechid', 'Benslimane', 'El Kelaa des Sraghna'],
  'Marrakech-Safi': ['Marrakech', 'Chichaoua', 'Al Haouz', 'El Kelaa des Sraghna', 'Essaouira', 'Rehamna', 'Safi', 'Youssoufia'],
  'Drâa-Tafilalet': ['Errachidia', 'Midelt', 'Ouarzazate', 'Tinghir', 'Zagora'],
  'Souss-Massa': ['Agadir Ida-Ou-Tanane', 'Chtouka-Ait Baha', 'Inezgane-Ait Melloul', 'Taroudannt', 'Tiznit', 'Tata'],
  'Guelmim-Oued Noun': ['Guelmim', 'Assa-Zag', 'Tan-Tan', 'Sidi Ifni'],
  'Laâyoune-Sakia El Hamra': ['Laâyoune', 'Boujdour', 'Tarfaya', 'Es-Semara'],
  'Dakhla-Oued Ed-Dahab': ['Oued Ed-Dahab', 'Aousserd']
};

export default function SimulateurTPME() {
  const [currentStep, setCurrentStep] = useState(-1); // Commencer par la page de disclaimer
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [projectData, setProjectData] = useState<TPMEProjectData>({
    secteurType: '',
    ratioMinRequis: 0,
    montantInvestissement: 0,
    secteurActivite: '',
    secteurActiviteAutre: '',
    fondsPropresPct: 10,
    fraisEtude: 0,
    foncierPrive: 0,
    foncierPublic: 0,
    constructions: 0,
    equipements: 0,
    emploisStablesCreus: 0,
    region: '',
    province: '',
    activitePrioritaire: false,
  });
  const [result, setResult] = useState<TPMESimulationResult | null>(null);

  // Reset result whenever projectData changes
  useEffect(() => {
    setResult(null);
  }, [projectData]);


  // Generate PDF export
  const exportToPDF = () => {
    if (!result) {
      alert('Résultats non disponibles. Veuillez attendre que les calculs soient terminés.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentDate = new Date().toLocaleDateString('fr-FR');
    const montantFormate = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Simulateur TPME - Résultats</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 40px; line-height: 1.6; color: #333; }
          .header { text-align: center; border-bottom: 3px solid #8B4513; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #8B4513; font-size: 24px; margin: 0; }
          .header p { color: #666; font-size: 14px; margin: 5px 0; }
          .section { margin-bottom: 25px; page-break-inside: avoid; }
          .section-title { background: linear-gradient(135deg, #8B4513, #A0522D); color: white; padding: 10px 15px; font-size: 16px; font-weight: bold; margin-bottom: 15px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
          .info-item { padding: 8px; border-left: 4px solid #8B4513; background: #f9f9f9; }
          .info-label { font-weight: bold; color: #8B4513; }
          .primes-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .primes-table th, .primes-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .primes-table th { background: #8B4513; color: white; font-weight: bold; }
          .prime-eligible { background: #e8f5e8; color: #2d5a2d; }
          .prime-non-eligible { background: #ffeaea; color: #8b4513; }
          .total-row { font-weight: bold; background: #f0f0f0; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SIMULATEUR TPME - RÉSULTATS</h1>
          <p>Dispositif d'Aide aux Très Petites, Petites et Moyennes Entreprises</p>
          <p>Généré le ${currentDate}</p>
        </div>

        <div class="section">
          <div class="section-title">📊 Récapitulatif du Projet</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Secteur d'activité</div>
              <div>${SECTEURS_TPME.find(s => s.value === projectData.secteurActivite)?.label}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Localisation</div>
              <div>${projectData.region} - ${projectData.province}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Montant d'investissement</div>
              <div>${montantFormate(projectData.montantInvestissement)} MAD</div>
            </div>
            <div class="info-item">
              <div class="info-label">Emplois stables créés</div>
              <div>${projectData.emploisStablesCreus} emplois</div>
            </div>
            <div class="info-item">
              <div class="info-label">Montant primable</div>
              <div>${montantFormate(Math.round(result.montantPrimable))} MAD</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">🎯 Détail des Primes</div>
          <table class="primes-table">
            <thead>
              <tr>
                <th>Type de Prime</th>
                <th>Taux</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr class="${result.primeEmplois > 0 ? 'prime-eligible' : 'prime-non-eligible'}">
                <td>Prime création d'emplois stables</td>
                <td>${result.primeEmplois}%</td>
                <td>${result.primeEmplois > 0 ? 'Éligible' : 'Non éligible'}</td>
              </tr>
              <tr class="${result.primeTerritoriale > 0 ? 'prime-eligible' : 'prime-non-eligible'}">
                <td>Prime territoriale</td>
                <td>${result.primeTerritoriale}%</td>
                <td>${result.primeTerritoriale > 0 ? 'Éligible' : 'Non éligible'}</td>
              </tr>
              <tr class="${result.primeSectorielle > 0 ? 'prime-eligible' : 'prime-non-eligible'}">
                <td>Prime sectorielle</td>
                <td>${result.primeSectorielle}%</td>
                <td>${result.primeSectorielle > 0 ? 'Éligible' : 'Non éligible'}</td>
              </tr>
              <tr class="total-row">
                <td><strong>Total des primes (plafonné à 30%)</strong></td>
                <td><strong>${result.totalPrimesAjustePct}%</strong></td>
                <td><strong>${montantFormate(Math.round(result.montantPrimesMAD))} MAD</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p><strong>INDUSTRIA</strong> - Simulateur TPME</p>
          <p>Ce document est une estimation basée sur les informations fournies. Les montants définitifs sont soumis à validation officielle.</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const getSteps = () => {
    const baseSteps = [
      'Critères d\'éligibilité',
      'Secteur d\'activité'
    ];
    
    if (projectData.secteurType === 'manufacturier') {
      baseSteps.push('Détails investissement');
    }
    
    baseSteps.push(
      'Répartition CAPEX',
      'Région',
      'Province',
      'Résultats'
    );
    
    return baseSteps;
  };

  const steps = getSteps();

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > -1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    if (currentStep === -1) {
      return acceptedTerms && acceptedDisclaimer; // Disclaimer - doit être accepté
    }
    
    const currentStepName = steps[currentStep];
    
    switch (currentStepName) {
      case 'Critères d\'éligibilité':
        return true; // Juste informatif
        
      case 'Secteur d\'activité':
        // Vérifier secteur, montant, capitaux propres et ratio emploi
        if (!projectData.secteurType) return false;
        if (projectData.montantInvestissement < 1000000 || projectData.montantInvestissement >= 50000000) return false;
        if (projectData.capitauxPropres < (projectData.montantInvestissement * 0.1)) return false;
        
        // Vérification d'éligibilité obligatoire
        const montantInvestissementEnMillions = projectData.montantInvestissement / 1000000;
        const ratioEmplois = montantInvestissementEnMillions > 0 ? projectData.emploisStablesCreus / montantInvestissementEnMillions : 0;
        const ratioEligible = ratioEmplois >= projectData.ratioMinRequis;
        
        return ratioEligible;
        
      case 'Détails investissement':
        // Seulement pour secteur manufacturier - vérifier secteur d'activité
        const secteurValid = projectData.secteurActivite !== '' && (projectData.secteurActivite !== 'autre' || projectData.secteurActiviteAutre !== '');
        return secteurValid;
        
      case 'Répartition CAPEX':
        return true; // Optionnel pour continuer
        
      case 'Région':
        return projectData.region !== '';
        
      case 'Province':
        return projectData.province !== '';
        
      case 'Résultats':
        return true;
        
      default:
        return true;
    }
  };

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const parseFormattedNumber = (str: string): number => {
    return parseInt(str.replace(/\s/g, '')) || 0;
  };

  // Fonction pour calculer le montant primable selon les règles TPME
  const calculateMontantPrimable = () => {
    const plafondFraisEtude = Math.min(projectData.montantInvestissement * 0.05, 500000);
    const fraisEtudeRetenus = Math.min(projectData.fraisEtude, plafondFraisEtude);
    
    const secteurEligibleFoncier = projectData.secteurType === 'manufacturier' || projectData.secteurType === 'touristique' || 
                                   ['industrie', 'tourisme-loisir', 'artisanat'].includes(projectData.secteurActivite);
    const plafondFoncierPrive = secteurEligibleFoncier ? Math.min(projectData.montantInvestissement * 0.2, 5000000) : 0;
    const foncierPriveRetenu = Math.min(projectData.foncierPrive, plafondFoncierPrive);
    
    return fraisEtudeRetenus + foncierPriveRetenu + projectData.constructions + projectData.equipements;
  };

  const calculateTPMEPrimes = () => {
    // Vérifications d'éligibilité
    let eligible = true;
    let raisonNonEligibilite = '';

    // Vérification secteur sélectionné
    if (!projectData.secteurType) {
      eligible = false;
      raisonNonEligibilite = 'Secteur d\'activité non sélectionné';
    }

    // Vérification montant d'investissement TPME
    if (projectData.montantInvestissement < 1000000) {
      eligible = false;
      raisonNonEligibilite = 'Montant d\'investissement minimum non atteint (1 000 000 DH)';
    }
    if (projectData.montantInvestissement >= 50000000) {
      eligible = false;
      raisonNonEligibilite = 'Montant d\'investissement dépassé (maximum 49 999 999 DH)';
    }

    // Vérification fonds propres
    if (projectData.fondsPropresPct < 10) {
      eligible = false;
      raisonNonEligibilite = 'Minimum 10% en fonds propres requis';
    }

    // Calcul du Montant d'Investissement Primable
    const montantPrimable = calculateMontantPrimable();

    // Prime emplois basée sur le ratio (Nombre d'emplois / Montant primable en millions DH)
    const montantPrimableEnMillions = montantPrimable / 1000000;
    const ratioEmplois = montantPrimableEnMillions > 0 ? projectData.emploisStablesCreus / montantPrimableEnMillions : 0;
    
    let primeEmplois = 0;
    if (ratioEmplois >= projectData.ratioMinRequis) {
      if (ratioEmplois > 10) {
        primeEmplois = 10;
      } else if (ratioEmplois > 5) {
        primeEmplois = 7;
      } else if (ratioEmplois >= 2) {
        primeEmplois = 5;
      }
    }

    // Prime territoriale (harmonisée avec simulateur principal)
    let primeTerritoriale = 0; // Défaut autres régions (spécifique TPME)
    if (PROVINCES_CATEGORIE_A.includes(projectData.province)) {
      primeTerritoriale = 10;
    } else if (PROVINCES_CATEGORIE_B.includes(projectData.province)) {
      primeTerritoriale = 15;
    }

    // Prime sectorielle (automatique selon secteur sélectionné)
    const primeSectorielle = projectData.activitePrioritaire ? 10 : 0;

    const totalPrimesPct = primeEmplois + primeTerritoriale + primeSectorielle;
    const totalPrimesAjustePct = Math.min(totalPrimesPct, 30);
    const montantPrimesMAD = (montantPrimable * totalPrimesAjustePct) / 100;

    const simulationResult: TPMESimulationResult = {
      montantPrimable,
      primeEmplois,
      primeTerritoriale,
      primeSectorielle,
      totalPrimesPct,
      totalPrimesAjustePct,
      montantPrimesMAD,
      eligible,
      raisonNonEligibilite
    };

    setResult(simulationResult);
  };

  const renderStep = () => {
    if (currentStep === -1) return renderDisclaimerStep();
    
    const currentStepName = steps[currentStep];
    
    switch (currentStepName) {
      case 'Critères d\'éligibilité':
        return renderEligibilityStep();
      case 'Secteur d\'activité':
        return renderSectorStep();
      case 'Détails investissement':
        return renderInvestmentDetailsStep();
      case 'Répartition CAPEX':
        return renderCapexStep();
      case 'Région':
        return renderRegionStep();
      case 'Province':
        return renderProvinceStep();
      case 'Résultats':
        return renderResultsStep();
      default:
        return null;
    }
  };

  const renderDisclaimerStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Simulateur TPME</h3>
        <p className="text-gray-600">Dispositif d'aide aux Très Petites, Petites et Moyennes Entreprises</p>
      </div>

      {/* Conditions d'utilisation */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-4">
            <h4 className="font-semibold">Conditions d'utilisation</h4>
            <div className="text-sm space-y-2">
              <p>• Ce simulateur est fourni à titre informatif uniquement</p>
              <p>• Les résultats sont basés sur la réglementation TPME en vigueur</p>
              <p>• L'utilisation implique l'acceptation de nos conditions générales</p>
              <p>• Vos données seront traitées conformément à notre politique de confidentialité</p>
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={setAcceptedTerms}
              />
              <Label htmlFor="terms" className="text-sm font-medium">
                J'accepte les conditions d'utilisation
              </Label>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Disclaimer */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-4">
            <h4 className="font-semibold text-orange-600">Clause de non-responsabilité</h4>
            <div className="text-sm space-y-2">
              <p><strong>IMPORTANT :</strong> Cette simulation n'a aucune valeur contractuelle.</p>
              <p>• Les montants calculés sont purement indicatifs</p>
              <p>• Les primes réelles dépendent de l'examen complet de votre dossier par les autorités compétentes</p>
              <p>• Industria décline toute responsabilité concernant l'exactitude des résultats</p>
              <p>• Cette simulation ne constitue pas un engagement de notre part</p>
              <p>• Pour une évaluation officielle, veuillez consulter les services compétents</p>
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <Checkbox
                id="disclaimer"
                checked={acceptedDisclaimer}
                onCheckedChange={setAcceptedDisclaimer}
              />
              <Label htmlFor="disclaimer" className="text-sm font-medium">
                J'ai lu et compris la clause de non-responsabilité
              </Label>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderEligibilityStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-semibold mb-4 text-industria-brown-gold">Critères d'éligibilité</h3>
        <p className="text-gray-600">Vérifiez que votre projet répond aux conditions suivantes</p>
      </div>

      {/* Critères d'éligibilité unifiés */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-lg text-green-700 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">✓</div>
            Critères d'éligibilité TPME
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-green-800 text-center">Conditions d'éligibilité</h4>
              <div className="text-center text-gray-700 mb-4">
                Votre projet doit remplir <strong>tous les critères suivants :</strong>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Critères Entreprise */}
                <div className="p-4 border-2 border-green-300 rounded-lg bg-green-100">
                  <h5 className="font-semibold text-green-800 mb-3 text-center">Entreprise</h5>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-600"></div>
                      <span className="text-sm text-green-800">CA : 1M DH ≤ CA &lt; 200M DH</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-600"></div>
                      <span className="text-sm text-green-800">Personne morale de droit marocain</span>
                    </div>
                  </div>
                </div>
                
                {/* Critères Projet */}
                <div className="p-4 border-2 border-blue-300 rounded-lg bg-blue-100">
                  <h5 className="font-semibold text-blue-800 mb-3 text-center">Projet</h5>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      <span className="text-sm text-blue-800">1M DH ≤ INV &lt; 50M DH</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      <span className="text-sm text-blue-800">Fonds propres ≥ 10%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      <span className="text-sm text-blue-800">Ratio emplois ≥ 1,5 (1,0 tourisme)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Alert className="bg-blue-100 border-blue-300 mt-4">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Important :</strong> Votre projet doit respecter tous les critères ci-dessus pour être éligible au dispositif TPME.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Secteurs éligibles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800">Secteurs d'activité éligibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="font-semibold text-green-700 mb-2">Secteurs prioritaires (Prime 10%) :</h5>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-industria-brown-gold"></div>
                <span className="text-sm">Tourisme et loisir</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-industria-brown-gold"></div>
                <span className="text-sm">Industrie</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-industria-brown-gold"></div>
                <span className="text-sm">Logistique</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-industria-brown-gold"></div>
                <span className="text-sm">Industrie culturelle</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-industria-brown-gold"></div>
                <span className="text-sm">Numérique</span>
              </div>
            </div>
            <div className="space-y-2">
              <h5 className="font-semibold text-green-700 mb-2">&nbsp;</h5>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-industria-brown-gold"></div>
                <span className="text-sm">Transport</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-industria-brown-gold"></div>
                <span className="text-sm">Outsourcing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-industria-brown-gold"></div>
                <span className="text-sm">Aquaculture</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-industria-brown-gold"></div>
                <span className="text-sm">Énergie renouvelable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-industria-brown-gold"></div>
                <span className="text-sm">Transformation des déchets</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-industria-brown-gold"></div>
                <span className="text-sm text-gray-600">Artisanat</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Types de primes disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800">Primes disponibles (cumulables)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 text-sm">Prime emplois</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Ratio emploi/CAPEX</span>
                  <Badge variant="secondary" className="text-xs">5-10%</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 text-sm">Prime territoriale</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Catégorie A</span>
                  <Badge variant="secondary" className="text-xs">10%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Catégorie B</span>
                  <Badge variant="secondary" className="text-xs">15%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Autres</span>
                  <Badge variant="secondary" className="text-xs">0%</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 text-sm">Prime sectorielle</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Secteurs prioritaires</span>
                  <Badge variant="secondary" className="text-xs">10%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Autres secteurs</span>
                  <Badge variant="secondary" className="text-xs">0%</Badge>
                </div>
              </div>
            </div>
          </div>
          
          <Alert className="bg-orange-50 border-orange-200 mt-4">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700">
              <strong>Plafond global :</strong> Le total des primes ne peut pas dépasser 30% du montant d'investissement primable.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Processus de validation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            🔍 Processus de validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Simulation en ligne</h4>
                <p className="text-sm text-gray-600">Utilisez ce simulateur pour estimer vos primes d'investissement selon vos critères.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Constitution du dossier</h4>
                <p className="text-sm text-gray-600">Préparez votre dossier complet avec tous les documents justificatifs requis.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Dépôt et instruction</h4>
                <p className="text-sm text-gray-600">Déposez votre demande auprès des autorités compétentes pour instruction.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Évaluation technique</h4>
                <p className="text-sm text-gray-600">Votre projet sera évalué selon les critères d'éligibilité TPME.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                5
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Décision et versement</h4>
                <p className="text-sm text-gray-600">Réception de la décision officielle.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSectorStep = () => {
    const montantInvestissementEnMillions = projectData.montantInvestissement / 1000000;
    const ratioEmplois = montantInvestissementEnMillions > 0 ? projectData.emploisStablesCreus / montantInvestissementEnMillions : 0;
    const ratioEligible = projectData.secteurType && ratioEmplois >= projectData.ratioMinRequis;
    const capitauxPropresEligibles = projectData.capitauxPropres >= (projectData.montantInvestissement * 0.1);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-semibold mb-4 text-industria-brown-gold">Secteur d'activité</h3>
          <p className="text-gray-600">Choisissez votre secteur d'activité principal</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${projectData.secteurType === 'manufacturier'
                ? 'border-2 border-blue-300 bg-blue-50'
                : 'border hover:border-blue-200'
              }`}
            onClick={() => setProjectData({
              ...projectData,
              secteurType: 'manufacturier',
              ratioMinRequis: 1.5
            })}
          >
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                  <Factory className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h4 className="text-xl font-semibold mb-2">Manufacturier</h4>
              <p className="text-sm text-gray-600 mb-3">
                Activités de production industrielle et manufacturière
              </p>
              <Badge className="bg-blue-100 text-blue-800">
                Ratio minimum requis: 1,5
              </Badge>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${projectData.secteurType === 'touristique'
                ? 'border-2 border-green-300 bg-green-50'
                : 'border hover:border-green-200'
              }`}
            onClick={() => setProjectData({
              ...projectData,
              secteurType: 'touristique',
              ratioMinRequis: 1,
              secteurActivite: 'tourisme-loisir',
              activitePrioritaire: true
            })}
          >
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h4 className="text-xl font-semibold mb-2">Touristique</h4>
              <p className="text-sm text-gray-600 mb-3">
                Activités liées au tourisme et aux loisirs
              </p>
              <div className="space-y-2">
                <Badge className="bg-green-100 text-green-800">
                  Ratio minimum requis: 1,0
                </Badge>
                <Badge className="bg-yellow-100 text-yellow-800">
                  Prime sectorielle: 10%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {projectData.secteurType && (
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                <strong>Ratio d'emplois :</strong> {projectData.ratioMinRequis === 1.5 ? 'Manufacturier' : 'Touristique'} - 
                Minimum requis {projectData.ratioMinRequis} emploi(s) stable(s) par million de DH d'investissement global.
              </AlertDescription>
            </Alert>

            {/* Champs d'investissement et capitaux propres */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-blue-700">Montant d'investissement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="montantInvest">Montant d'investissement (MAD)</Label>
                    <Input
                      id="montantInvest"
                      type="text"
                      value={projectData.montantInvestissement ? formatNumber(projectData.montantInvestissement) : ''}
                      onChange={(e) => {
                        const numValue = parseFormattedNumber(e.target.value);
                        setProjectData({ ...projectData, montantInvestissement: numValue });
                      }}
                      placeholder="Entre 1 000 000 et 49 999 999 MAD"
                      className="text-sm"
                    />
                    {projectData.montantInvestissement > 0 && projectData.montantInvestissement < 1000000 && (
                      <p className="text-red-500 text-xs mt-1">Montant minimum : 1 000 000 MAD</p>
                    )}
                    {projectData.montantInvestissement >= 50000000 && (
                      <p className="text-red-500 text-xs mt-1">Montant maximum : 49 999 999 MAD</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 bg-purple-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-purple-700">Capitaux propres</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="capitaux">Capitaux propres (MAD)</Label>
                    <Input
                      id="capitaux"
                      type="text"
                      value={projectData.capitauxPropres ? formatNumber(projectData.capitauxPropres) : ''}
                      onChange={(e) => {
                        const numValue = parseFormattedNumber(e.target.value);
                        setProjectData({ ...projectData, capitauxPropres: numValue });
                      }}
                      placeholder="Montant des capitaux propres"
                      className="text-sm"
                    />
                    {projectData.montantInvestissement > 0 && (
                      <div className="text-xs text-gray-600 mt-1">
                        Minimum requis : {formatNumber(projectData.montantInvestissement * 0.1)} MAD (10%)
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vérification ratio emploi stable */}
            <Card className={`border-2 ${ratioEligible ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-sm flex items-center gap-2 ${ratioEligible ? 'text-green-700' : 'text-red-700'}`}>
                  <AlertCircle className="w-4 h-4" />
                  Ratio emploi stable
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="emplois">Emplois stables créés</Label>
                  <Input
                    id="emplois"
                    type="number"
                    min="0"
                    value={projectData.emploisStablesCreus === 0 ? '' : projectData.emploisStablesCreus}
                    onChange={(e) => setProjectData({ ...projectData, emploisStablesCreus: parseInt(e.target.value) || 0 })}
                    placeholder="Nombre d'emplois"
                    className="text-sm"
                  />
                </div>
                {projectData.montantInvestissement > 0 && projectData.emploisStablesCreus > 0 && (
                  <div className="text-xs space-y-2">
                    <div className="text-gray-600">
                      Ratio : {projectData.emploisStablesCreus} ÷ {formatNumber(montantInvestissementEnMillions, 2)} = <strong>{formatNumber(ratioEmplois, 2)}</strong>
                    </div>
                    <div className={ratioEligible ? 'text-green-600' : 'text-red-600'}>
                      {ratioEligible ? '✓ Éligible' : `✗ Insuffisant (min: ${projectData.ratioMinRequis})`}
                    </div>
                    
                    {/* Affichage de la tranche de prime */}
                    {ratioEligible && (
                      <div className="bg-white p-2 rounded border">
                        <div className="font-medium text-gray-700 mb-1">Tranche de prime emplois :</div>
                        {(() => {
                          if (projectData.emploisStablesCreus >= 10) {
                            return <div className="text-green-600 font-semibold">≥ 10 emplois → 10% du montant primable</div>;
                          } else if (projectData.emploisStablesCreus >= 5) {
                            return <div className="text-blue-600 font-semibold">5 à 9 emplois → 7% du montant primable</div>;
                          } else if (projectData.emploisStablesCreus >= 2) {
                            return <div className="text-orange-600 font-semibold">2 à 4 emplois → 5% du montant primable</div>;
                          } else if (projectData.secteurActivite === 'tourisme-loisir' && projectData.emploisStablesCreus >= 1) {
                            return <div className="text-purple-600 font-semibold">Tourisme ≥ 1 emploi → 5% du montant primable</div>;
                          }
                          return <div className="text-gray-600">Aucune prime emplois</div>;
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {projectData.montantInvestissement > 0 && projectData.emploisStablesCreus > 0 && projectData.capitauxPropres > 0 && (
              <Alert className={(ratioEligible && capitauxPropresEligibles) ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}>
                <AlertCircle className={`h-4 w-4 ${(ratioEligible && capitauxPropresEligibles) ? 'text-green-600' : 'text-red-600'}`} />
                <AlertDescription className={(ratioEligible && capitauxPropresEligibles) ? 'text-green-700' : 'text-red-700'}>
                  {(ratioEligible && capitauxPropresEligibles) ? (
                    <><strong>✓ Projet éligible :</strong> Tous les critères sont respectés.</>
                  ) : (
                    <><strong>✗ Projet non éligible :</strong> {!ratioEligible && 'Ratio emploi insuffisant'}{!ratioEligible && !capitauxPropresEligibles && ' et '}{!capitauxPropresEligibles && 'Capitaux propres insuffisants'}.</>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderRegionStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-semibold mb-4 text-industria-brown-gold">Région d'implantation</h3>
        <p className="text-gray-600">Sélectionnez votre région d'implantation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.keys(REGIONS_PROVINCES_TPME).map((region) => (
          <Card
            key={region}
            className={`cursor-pointer transition-all hover:shadow-md ${projectData.region === region
                ? 'border-2 border-blue-300 bg-blue-50'
                : 'border hover:border-blue-200'
              }`}
            onClick={() => {
              setProjectData({
                ...projectData,
                region: region,
                province: '' // Reset province
              });
            }}
          >
            <CardContent className="p-4">
              <h4 className="font-medium text-sm">{region}</h4>
              <p className="text-xs text-gray-500 mt-1">
                {REGIONS_PROVINCES_TPME[region as keyof typeof REGIONS_PROVINCES_TPME].length} provinces
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderProvinceStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-semibold mb-4 text-industria-brown-gold">Province d'implantation</h3>
        <p className="text-gray-600">Sélectionnez votre province dans la région {projectData.region}</p>
      </div>

      {projectData.region && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REGIONS_PROVINCES_TPME[projectData.region as keyof typeof REGIONS_PROVINCES_TPME].map((province) => {
            let category = 'Autres (0%)';
            let categoryColor = 'bg-gray-100 text-gray-700';

            if (PROVINCES_CATEGORIE_A.includes(province)) {
              category = 'Catégorie A (10%)';
              categoryColor = 'bg-blue-100 text-blue-700';
            } else if (PROVINCES_CATEGORIE_B.includes(province)) {
              category = 'Catégorie B (15%)';
              categoryColor = 'bg-green-100 text-green-700';
            }

            return (
              <Card
                key={province}
                className={`cursor-pointer transition-all hover:shadow-md ${projectData.province === province
                    ? 'border-2 border-blue-300 bg-blue-50'
                    : 'border hover:border-blue-200'
                  }`}
                onClick={() => setProjectData({ ...projectData, province: province })}
              >
                <CardContent className="p-4">
                  <h4 className="font-medium text-sm mb-2">{province}</h4>
                  <Badge className={`text-xs ${categoryColor}`}>
                    {category}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderInvestmentStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-semibold mb-4 text-industria-brown-gold">Détails de l'investissement</h3>
        <p className="text-gray-600">Informations sur votre projet d'investissement</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-700">Investissement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="montantInvest">Montant d'investissement (DH)</Label>
              <Input
                id="montantInvest"
                type="text"
                value={projectData.montantInvestissement ? formatNumber(projectData.montantInvestissement) : ''}
                onChange={(e) => {
                  const numValue = parseFormattedNumber(e.target.value);
                  setProjectData({ ...projectData, montantInvestissement: numValue });
                }}
                placeholder="Entre 1 000 000 et 49 999 999 DH"
              />
              {projectData.montantInvestissement < 1000000 && projectData.montantInvestissement > 0 && (
                <p className="text-red-500 text-sm mt-1">Montant minimum : 1 000 000 DH</p>
              )}
              {projectData.montantInvestissement >= 50000000 && (
                <p className="text-red-500 text-sm mt-1">Montant maximum : 49 999 999 DH</p>
              )}
            </div>

            <div>
              <Label htmlFor="fondsPropresPct">Pourcentage de fonds propres (%)</Label>
              <Input
                id="fondsPropresPct"
                type="number"
                min="10"
                max="100"
                value={projectData.fondsPropresPct}
                onChange={(e) => setProjectData({ ...projectData, fondsPropresPct: parseFloat(e.target.value) })}
              />
              {projectData.fondsPropresPct < 10 && (
                <p className="text-red-500 text-sm mt-1">Minimum 10% en fonds propres requis</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-semibold mb-4 text-industria-brown-gold">Secteur d'activité</h3>
          <p className="text-gray-600">Sélectionnez votre secteur d'activité principal</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTEURS_TPME.map((secteur) => (
            <Card
              key={secteur.value}
              className={`cursor-pointer transition-all hover:shadow-md ${projectData.secteurActivite === secteur.value
                  ? secteur.prioritaire
                    ? 'border-2 border-green-300 bg-green-50'
                    : 'border-2 border-orange-300 bg-orange-50'
                  : 'border hover:border-blue-200'
                }`}
              onClick={() => {
                setProjectData({
                  ...projectData,
                  secteurActivite: secteur.value,
                  activitePrioritaire: secteur.prioritaire,
                  secteurActiviteAutre: secteur.value === 'autre' ? projectData.secteurActiviteAutre : ''
                });
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm">{secteur.label}</h4>
                  {secteur.prioritaire && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                      Prime 10%
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {projectData.secteurActivite === 'autre' && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-700">Précisez votre secteur</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="secteurAutre">Secteur d'activité</Label>
                <Input
                  id="secteurAutre"
                  type="text"
                  value={projectData.secteurActiviteAutre || ''}
                  onChange={(e) => setProjectData({ ...projectData, secteurActiviteAutre: e.target.value })}
                  placeholder="Décrivez votre secteur d'activité"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderInvestmentDetailsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-semibold mb-4 text-industria-brown-gold">Détails de l'investissement</h3>
        <p className="text-gray-600">Secteur d'activité manufacturier</p>
      </div>

      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4 text-industria-brown-gold">Secteur d'activité</h3>
          <p className="text-gray-600">Sélectionnez votre secteur d'activité principal</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTEURS_TPME.filter((secteur) => {
            // Pour le secteur manufacturier, exclure tourisme-loisir
            if (projectData.secteurType === 'manufacturier') {
              return secteur.value !== 'tourisme-loisir';
            }
            return true;
          }).map((secteur) => (
            <Card
              key={secteur.value}
              className={`cursor-pointer transition-all hover:shadow-md ${projectData.secteurActivite === secteur.value
                  ? secteur.prioritaire
                    ? 'border-2 border-green-300 bg-green-50'
                    : 'border-2 border-orange-300 bg-orange-50'
                  : 'border hover:border-blue-200'
                }`}
              onClick={() => {
                setProjectData({
                  ...projectData,
                  secteurActivite: secteur.value,
                  activitePrioritaire: secteur.prioritaire,
                  secteurActiviteAutre: secteur.value === 'autre' ? projectData.secteurActiviteAutre : ''
                });
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm">{secteur.label}</h4>
                  {secteur.prioritaire && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                      Prime 10%
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {projectData.secteurActivite === 'autre' && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-700">Précisez votre secteur</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="secteurAutre">Secteur d'activité</Label>
                <Input
                  id="secteurAutre"
                  type="text"
                  value={projectData.secteurActiviteAutre || ''}
                  onChange={(e) => setProjectData({ ...projectData, secteurActiviteAutre: e.target.value })}
                  placeholder="Décrivez votre secteur d'activité"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderCapexStep = () => {
    // Calculer la somme de la ventilation CAPEX
    const sommeCAPEX = projectData.fraisEtude + projectData.foncierPrive + 
                       projectData.foncierPublic + projectData.constructions + 
                       projectData.equipements;
    
    const ecartMontant = Math.abs(sommeCAPEX - projectData.montantInvestissement);
    const pourcentageEcart = projectData.montantInvestissement > 0 ? 
      (ecartMontant / projectData.montantInvestissement) * 100 : 0;
    
    const isCoherent = ecartMontant <= (projectData.montantInvestissement * 0.01); // Tolérance de 1%

    // Calcul du Montant d'Investissement Primable selon les règles TPME
    let montantPrimable = projectData.montantInvestissement;
    
    // 1. Plafonnement frais d'études à 5% du montant primable, max 500 000 DH
    const plafondFraisEtude = Math.min(montantPrimable * 0.05, 500000);
    const fraisEtudeRetenus = Math.min(projectData.fraisEtude, plafondFraisEtude);
    
    // 2. Foncier privé plafonné à 20% du montant primable, max 5 000 000 DH (seulement pour industrie, tourisme, artisanat)
    const secteurEligibleFoncier = projectData.secteurType === 'manufacturier' || projectData.secteurType === 'touristique' || 
                                   ['industrie', 'tourisme-loisir', 'artisanat'].includes(projectData.secteurActivite);
    const plafondFoncierPrive = secteurEligibleFoncier ? Math.min(montantPrimable * 0.2, 5000000) : 0;
    const foncierPriveRetenu = Math.min(projectData.foncierPrive, plafondFoncierPrive);
    
    // 3. Foncier public exclu complètement
    // 4. Véhicules exclus (pas de champ spécifique ici)
    
    // Calcul final du montant primable
    montantPrimable = fraisEtudeRetenus + foncierPriveRetenu + projectData.constructions + projectData.equipements;
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-semibold mb-4 text-industria-brown-gold">Répartition de votre CAPEX</h3>
          <p className="text-gray-600">Détaillez la répartition de votre investissement (optionnel)</p>
        </div>

        {/* Information sur le montant d'investissement primable */}
        <Alert className="bg-indigo-50 border-indigo-200">
          <AlertCircle className="h-4 w-4 text-indigo-600" />
          <AlertDescription className="text-indigo-800">
            <strong>Montant d'Investissement Primable (MIP) :</strong> Il s'agit du montant sur lequel seront calculées les primes d'investissement selon les règles TPME :
            <br/>• Frais d'études plafonnés à 5% (max 500 000 DH)
            <br/>• Foncier privé plafonné à 20% (max 5 000 000 DH) pour industrie/tourisme/artisanat
            <br/>• Foncier public exclu
            <br/>• Véhicules exclus
          </AlertDescription>
        </Alert>

        {/* Récapitulatif montant total */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Montant total à ventiler :</strong> {formatNumber(projectData.montantInvestissement)} MAD
          </AlertDescription>
        </Alert>

        {/* Ventilation CAPEX */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-700">Ventilation détaillée</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fraisEtude">Frais d'études, marques et procédés</Label>
                <Input
                  id="fraisEtude"
                  type="text"
                  value={projectData.fraisEtude ? formatNumber(projectData.fraisEtude) : ''}
                  onChange={(e) => {
                    const numValue = parseFormattedNumber(e.target.value);
                    setProjectData({ ...projectData, fraisEtude: numValue });
                  }}
                  placeholder="0 MAD"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max retenu: {formatNumber(plafondFraisEtude)} MAD (5% plafonné à 500 000 DH)
                </p>
              </div>

              <div>
                <Label htmlFor="foncierPrive">Foncier privé</Label>
                <Input
                  id="foncierPrive"
                  type="text"
                  value={projectData.foncierPrive ? formatNumber(projectData.foncierPrive) : ''}
                  onChange={(e) => {
                    const numValue = parseFormattedNumber(e.target.value);
                    setProjectData({ ...projectData, foncierPrive: numValue });
                  }}
                  placeholder="0 MAD"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {secteurEligibleFoncier 
                    ? `Max retenu: ${formatNumber(plafondFoncierPrive)} MAD (20% plafonné à 5 000 000 DH)`
                    : 'Non éligible pour ce secteur (exclu du calcul)'
                  }
                </p>
              </div>

              <div>
                <Label htmlFor="foncierPublic">Foncier public</Label>
                <Input
                  id="foncierPublic"
                  type="text"
                  value={projectData.foncierPublic ? formatNumber(projectData.foncierPublic) : ''}
                  onChange={(e) => {
                    const numValue = parseFormattedNumber(e.target.value);
                    setProjectData({ ...projectData, foncierPublic: numValue });
                  }}
                  placeholder="0 MAD"
                />
                <p className="text-xs text-red-500 mt-1">
                  Exclu du calcul du montant primable
                </p>
              </div>

              <div>
                <Label htmlFor="constructions">Constructions et aménagements</Label>
                <Input
                  id="constructions"
                  type="text"
                  value={projectData.constructions ? formatNumber(projectData.constructions) : ''}
                  onChange={(e) => {
                    const numValue = parseFormattedNumber(e.target.value);
                    setProjectData({ ...projectData, constructions: numValue });
                  }}
                  placeholder="0 MAD"
                />
              </div>

              <div>
                <Label htmlFor="equipements">Équipements et matériels</Label>
                <Input
                  id="equipements"
                  type="text"
                  value={projectData.equipements ? formatNumber(projectData.equipements) : ''}
                  onChange={(e) => {
                    const numValue = parseFormattedNumber(e.target.value);
                    setProjectData({ ...projectData, equipements: numValue });
                  }}
                  placeholder="0 MAD"
                />
              </div>
            </CardContent>
          </Card>

          {/* Calcul du montant primable */}
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg text-green-700">Calcul du Montant Primable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Frais d'études (retenus)</span>
                  <span className="font-medium">{formatNumber(fraisEtudeRetenus)} MAD</span>
                </div>
                <div className="flex justify-between">
                  <span>Foncier privé (retenu)</span>
                  <span className="font-medium">{formatNumber(foncierPriveRetenu)} MAD</span>
                </div>
                <div className="flex justify-between">
                  <span>Foncier public</span>
                  <span className="text-red-600 line-through">{formatNumber(projectData.foncierPublic)} MAD</span>
                </div>
                <div className="flex justify-between">
                  <span>Constructions</span>
                  <span className="font-medium">{formatNumber(projectData.constructions)} MAD</span>
                </div>
                <div className="flex justify-between">
                  <span>Équipements</span>
                  <span className="font-medium">{formatNumber(projectData.equipements)} MAD</span>
                </div>
              </div>

              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-green-800">Montant Primable Total</span>
                  <span className="font-bold text-xl text-green-800">{formatNumber(Math.round(montantPrimable))} MAD</span>
                </div>
                {montantPrimable !== projectData.montantInvestissement && (
                  <p className="text-xs text-gray-600 mt-1">
                    Différence: {formatNumber(Math.round(projectData.montantInvestissement - montantPrimable))} MAD exclus
                  </p>
                )}
              </div>

              {/* Exclusions appliquées */}
              {(projectData.fraisEtude > plafondFraisEtude || projectData.foncierPrive > plafondFoncierPrive || projectData.foncierPublic > 0) && (
                <Alert className="bg-orange-50 border-orange-200">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-700 text-xs">
                    <strong>Plafonds appliqués :</strong>
                    {projectData.fraisEtude > plafondFraisEtude && (
                      <div>• Frais d'études : {formatNumber(projectData.fraisEtude - plafondFraisEtude)} MAD exclus</div>
                    )}
                    {projectData.foncierPrive > plafondFoncierPrive && (
                      <div>• Foncier privé : {formatNumber(projectData.foncierPrive - plafondFoncierPrive)} MAD exclus</div>
                    )}
                    {projectData.foncierPublic > 0 && (
                      <div>• Foncier public : {formatNumber(projectData.foncierPublic)} MAD exclu</div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Vérification de cohérence */}
        {sommeCAPEX > 0 && (
          <Card className={`border-2 ${
            isCoherent 
              ? 'border-green-200 bg-green-50' 
              : 'border-orange-200 bg-orange-50'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className={`font-semibold ${
                  isCoherent ? 'text-green-800' : 'text-orange-800'
                }`}>
                  Vérification de cohérence
                </h4>
                <Badge variant={isCoherent ? 'default' : 'destructive'} className="text-xs">
                  {isCoherent ? '✓ Cohérent' : '⚠ Incohérence'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Montant total déclaré</p>
                  <p className="font-medium">{formatNumber(projectData.montantInvestissement)} MAD</p>
                </div>
                <div>
                  <p className="text-gray-600">Somme des rubriques</p>
                  <p className="font-medium">{formatNumber(sommeCAPEX)} MAD</p>
                </div>
              </div>

              {!isCoherent && (
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Répartition automatique suggérée
                      setProjectData({
                        ...projectData,
                        fraisEtude: Math.round(projectData.montantInvestissement * 0.05), // 5%
                        foncierPrive: Math.round(projectData.montantInvestissement * 0.15), // 15%
                        foncierPublic: 0,
                        constructions: Math.round(projectData.montantInvestissement * 0.30), // 30%
                        equipements: Math.round(projectData.montantInvestissement * 0.50) // 50%
                      });
                    }}
                    className="text-xs"
                  >
                    Répartition suggérée (5% étude + 15% foncier + 30% construction + 50% équipements)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };



  const renderResultsStep = () => {
    // Si les résultats ne sont pas encore disponibles, les calculer
    if (!result) {
      calculateTPMEPrimes();
      return <div className="text-center py-8">Calcul en cours...</div>;
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Résultats de votre simulation TPME</h3>
          <p className="text-gray-600">Estimation de vos primes d'investissement</p>
        </div>

        {!result.eligible ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Projet non éligible :</strong> {result.raisonNonEligibilite}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-green-50 border-green-200">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              <strong>Félicitations !</strong> Votre projet est éligible au dispositif TPME.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Résumé financier */}
          <Card className="border-2 border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-lg text-green-700 flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Résumé financier
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-gray-600">Montant d'investissement</span>
                <span className="font-medium">{formatNumber(projectData.montantInvestissement)} MAD</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-gray-600">Montant primable</span>
                <span className="font-medium">{formatNumber(Math.round(result.montantPrimable))} MAD</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-gray-600">Taux de prime total</span>
                <span className="font-semibold text-lg text-green-600">{result.totalPrimesAjustePct}%</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-medium text-green-700">Montant des primes</span>
                <span className="font-bold text-xl text-green-700">{formatNumber(Math.round(result.montantPrimesMAD))} MAD</span>
              </div>
            </CardContent>
          </Card>

          {/* Détail des primes */}
          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-lg text-blue-700 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Détail des primes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Prime création d'emplois</span>
                {result.primeEmplois > 0 ? (
                  <Badge className="bg-green-600">{result.primeEmplois}%</Badge>
                ) : (
                  <Badge variant="destructive">Non éligible</Badge>
                )}
              </div>

              <div className="flex justify-between">
                <span>Prime territoriale</span>
                {result.primeTerritoriale > 0 ? (
                  <Badge className="bg-green-600">{result.primeTerritoriale}%</Badge>
                ) : (
                  <Badge variant="destructive">Non éligible</Badge>
                )}
              </div>

              <div className="flex justify-between">
                <span>Prime sectorielle</span>
                {result.primeSectorielle > 0 ? (
                  <Badge className="bg-green-600">{result.primeSectorielle}%</Badge>
                ) : (
                  <Badge variant="destructive">Non éligible</Badge>
                )}
              </div>

              {result.totalPrimesPct > 30 && (
                <Alert className="bg-orange-50 border-orange-200 mt-3">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-700 text-xs">
                    Total avant plafonnement : {result.totalPrimesPct}% → Plafonné à 30%
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Récapitulatif projet */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Récapitulatif projet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Secteur:</span>
              <span className="font-medium">{SECTEURS_TPME.find(s => s.value === projectData.secteurActivite)?.label}</span>
            </div>
            <div className="flex justify-between">
              <span>Localisation:</span>
              <span className="font-medium">{projectData.province}</span>
            </div>
            <div className="flex justify-between">
              <span>Emplois créés:</span>
              <span className="font-medium">{projectData.emploisStablesCreus}</span>
            </div>
          </CardContent>
        </Card>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-900">Simulateur TPME</h2>
              <Badge variant="outline" className="px-3 py-1">
                Étape {currentStep + 2} sur {steps.length}
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-industria-brown-gold to-industria-olive-light h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 2) / steps.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{steps[currentStep + 1]}</p>
          </div>

          {/* Step content */}
          <Card>
            <CardContent className="p-8">
              {renderStep()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              onClick={handlePrevStep}
              disabled={currentStep === -1}
              variant="outline"
              className="px-6"
            >
              Précédent
            </Button>

            <div className="flex gap-3">
              {currentStep === steps.length - 1 ? (
                <>
                  <Button
                    onClick={exportToPDF}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exporter en PDF
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6"
                  >
                    Nouvelle simulation
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleNextStep}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-industria-brown-gold to-industria-olive-light text-white px-6"
                >
                  {currentStep === steps.length - 2 ? 'Calculer' : 'Suivant'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}