'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Calculator, FileText, TrendingUp } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';

// Types pour le simulateur
interface ProjectData {
  // Step 1: Secteur et métier
  secteur: string;
  metier: string;
  // Step 2: Localisation
  region: string;
  province: string;
  // Step 3: Projet
  montantTotal: number;
  emploisStables: number;
  // Step 4: CAPEX
  fraisEtude: number;
  foncierPrive: number;
  foncierPublic: number;
  constructions: number;
  equipements: number;
  // Step 5: Primes spécifiques
  partFemmesPct: number;
  criteresDD: string[];
  achatLocaux: number;
  valeurAjoutee: number;
  margeBrute: number;
  chiffreAffaires: number;
}

interface SimulationResult {
  mip: number;
  primeRatioEmploi: number;
  primeGenre: number;
  primeMetiersAvenir: number;
  primeDD: number;
  primeIntegration: number;
  primeSectorielle: number;
  primeTerritoriale: number;
  totalPrimesPct: number;
  totalPrimesAjustePct: number;
  montantPrimesMAD: number;
}

// Nouveaux secteurs et métiers selon la liste fournie
const SECTEURS_METIERS = {
  'Industrie automobile': [
    'Fabrication de pièces détachées et de composants pour moteurs thermiques et électriques',
    'Fabrication de pièces de rechange et composants pour véhicules lourds',
    'Fabrication pneumatique'
  ],
  'Industrie aéronautique': [
    'Fabrication d\'équipements auxiliaires et de produits aérospatiaux',
    'Fabrication de pièces et composants de moteurs d\'avions',
    'Maintenance et démontage d\'avions'
  ],
  'Industrie agricole': [
    'Alimentation animale',
    'Nourriture pour bébé',
    'Plats cuisinés',
    'Complément alimentaire',
    'Fabrication de produits alimentaires "sains"',
    'Fabrication d\'équipements d\'irrigation à pivot',
    'Développement d\'outils numériques d\'exploitation agricole'
  ],
  'Industrie diversifiée': [
    'Fabrication de moules',
    'Développement des matériaux composites'
  ],
  'Industrie Maritime': [
    'Démantèlement de navires',
    'Construction et entretien de navires'
  ],
  'Industrie pharmaceutique': [
    'Industrie des dispositifs médicaux',
    'Transformation de plantes aromatiques et médicinales',
    'Transformation du cannabis à des fins médicales, pharmaceutiques et industrielles',
    'Valorisation de la biomasse algale à des fins cosmétiques ou thérapeutiques',
    'Fabrication de médicaments, de vaccins et de principes actifs'
  ],
  'Secteur minier': [
    'Valoriser les ressources minérales par la production de dérivés à haute valeur ajoutée',
    'Valorisation des coproduits du phosphate'
  ],
  'Industrie du textile et du cuir': [
    'Tissu technique',
    'Cuir technique'
  ],
  'Transition énergétique': [
    'Fabrication d\'équipements de dessalement d\'eau de mer'
  ],
  'Technologie numérique & Secteur numérique': [
    'Biotechnologie',
    'Cybersécurité',
    'Blockchain',
    'Cloud computing et data center',
    'Domotique',
    'Jeux vidéo',
    'Technologies modernes pour l\'efficacité énergétique et de l\'eau',
    'Équipements et infrastructures de transport de nouvelle génération 5G-6G',
    'Intelligence artificielle',
    'Nanotechnologie',
    'Agritech',
    'Healthtech',
    'Industrie 4.0/Edtech',
    'Fintech',
    'Govtech',
    'Réalité virtuelle/réalité augmentée'
  ],
  'Industrie énergies renouvelables': [
    'Installation de production et de stockage d\'énergie renouvelable'
  ],
  'Mobilité': [
    'Mobilité autonome',
    'Mobilité électrique',
    'Mobilité ferroviaire et maritime'
  ],
  'Autres secteurs': [
    'Électronique de puissance',
    'Compteurs intelligents',
    'Industrie robotique',
    'Semi-conducteurs (EMS) et composants associés',
    'Bornes et recharges et composants associés',
    'Fabrication d\'appareils techniques et intelligents',
    'Fabrication additive (impression 3D)'
  ]
};

const REGIONS_PROVINCES = {
  'Tanger-Tétouan-Al Hoceïma': ['Tanger-Assilah', 'Fahs-Anjra', 'M\'diq-Fnideq', 'Tétouan', 'Larache', 'Al Hoceïma', 'Chefchaouen', 'Ouezzane'],
  'L\'Oriental': ['Oujda-Angad', 'Nador', 'Driouch', 'Jerada', 'Berkane', 'Taourirt', 'Guercif', 'Figuig'],
  'Fès-Meknès': ['Fès', 'Meknès', 'El Hajeb', 'Ifrane', 'Moulay Yacoub', 'Sefrou', 'Boulemane', 'Taounate', 'Taza'],
  'Rabat-Salé-Kénitra': ['Rabat', 'Salé', 'Skhirate-Témara', 'Kénitra', 'Khemisset', 'Sidi Kacem', 'Sidi Slimane'],
  'Béni Mellal-Khénifra': ['Béni Mellal', 'Azilal', 'Fquih Ben Salah', 'Khénifra', 'Khouribga'],
  'Casablanca-Settat': ['Casablanca', 'Mohammedia', 'El Jadida', 'Nouaceur', 'Médiouna', 'Benslimane', 'Berrechid', 'Settat', 'Sidi Bennour'],
  'Marrakech-Safi': ['Marrakech', 'Chichaoua', 'Al Haouz', 'Kelâa des Sraghna', 'Essaouira', 'Rehamna', 'Safi', 'Youssoufia'],
  'Drâa-Tafilalet': ['Errachidia', 'Midelt', 'Tinghir', 'Zagora', 'Ouarzazate'],
  'Souss-Massa': ['Agadir Ida-Ou-Tanane', 'Inezgane-Aït Melloul', 'Chtouka-Aït Baha', 'Taroudannt', 'Tiznit', 'Tata'],
  'Guelmim-Oued Noun': ['Guelmim', 'Assa-Zag', 'Tan-Tan', 'Sidi Ifni'],
  'Laâyoune-Sakia El Hamra': ['Laâyoune', 'Boujdour', 'Tarfaya', 'Es-Semara'],
  'Dakhla-Oued Ed-Dahab': ['Oued Ed-Dahab', 'Aousserd']
};

const PROVINCES_A = [
  'Larache', 'M\'diq-Fnideq', 'Ouazzane', 'Tétouan', 'Chefchaouen',
  'Nador', 'Berkane', 'Sefrou', 'Boulemane', 'Taza', 'Fès', 'Meknès',
  'El Hajeb', 'Ifrane', 'Sidi Slimane', 'Khemisset', 'Sidi Kacem', 'Salé',
  'Beni Mellal', 'Khénifra', 'Khouribga', 'Fquih Ben Salah', 'Sidi Bennour',
  'Safi', 'Youssoufia', 'Al Haouz', 'Kelaa Sraghna', 'Essaouira', 'Rhamna',
  'Chichaoua', 'Ouarzazate', 'Taroudant', 'Chtouka Aït Baha', 'Inezgane Aït Melloul',
  'Laâyoune', 'Oued Eddahab'
];

const PROVINCES_B = [
  'Al Hoceima', 'Taourirt', 'Driouch', 'Jerada', 'Guercif', 'Oujda-Angad',
  'Figuig', 'Moulay Yacoub', 'Taounate', 'Azilal', 'Errachidia', 'Midelt',
  'Tinghir', 'Zagora', 'Tata', 'Tiznit', 'Sidi Ifni', 'Guelmim', 'Assa Zag',
  'Tan-Tan', 'Boujdour', 'Tarfaya', 'Es-Semara', 'Aousserd'
];

const CRITERES_DD = [
  'Système d\'économie d\'eau (obligatoire)',
  'Énergies renouvelables',
  'Efficacité énergétique',
  'Traitement des déchets',
  'Programmes sociaux',
  'Certification environnementale'
];

export default function SimulateurPrincipal() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [projectData, setProjectData] = useState<ProjectData>({
    secteur: '',
    metier: '',
    region: '',
    province: '',
    montantTotal: 0,
    emploisStables: 0,
    fraisEtude: 0,
    foncierPrive: 0,
    foncierPublic: 0,
    constructions: 0,
    equipements: 0,
    partFemmesPct: 0,
    criteresDD: [],
    achatLocaux: 0,
    valeurAjoutee: 0,
    margeBrute: 0,
    chiffreAffaires: 0,
  });
  const [result, setResult] = useState<SimulationResult | null>(null);

  const steps = [
    'Conditions d\'utilisation',
    'Critères d\'éligibilité',
    'Secteur d\'activité',
    'Métier spécialisé', 
    'Région',
    'Province',
    'Données projet',
    'Répartition CAPEX',
    'Primes spécifiques',
    'Résultats'
  ];

  const handleStartSimulation = () => {
    if (acceptedTerms && acceptedDisclaimer) {
      setCurrentStep(1);
    }
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return true; // Critères d'éligibilité - juste informatif
      case 2: return projectData.secteur !== '';
      case 3: return projectData.metier !== '';
      case 4: return projectData.region !== '';
      case 5: return projectData.province !== '';
      case 6: return projectData.montantTotal >= 50000000 && projectData.emploisStables >= 50;
      case 7: return true; // CAPEX est optionnel pour continuer
      case 8: return true; // Primes spécifiques sont optionnelles
      default: return true;
    }
  };

  const calculatePrimes = () => {
    // Vérifications d'éligibilité
    if (projectData.montantTotal < 50000000 || projectData.emploisStables < 50) {
      alert('Projet non éligible : Montant minimum 50M MAD et 50 emplois stables requis');
      return;
    }

    // Calcul MIP
    const partFoncierPrivePct = (projectData.foncierPrive / projectData.montantTotal) * 100;
    const mip = partFoncierPrivePct <= 20 
      ? projectData.montantTotal - projectData.foncierPublic
      : (projectData.montantTotal - projectData.foncierPrive - projectData.foncierPublic) + (0.20 * projectData.montantTotal);

    // Calcul des primes
    const capexEnMDH = projectData.montantTotal / 1000000;
    const ratio = projectData.emploisStables / capexEnMDH;
    
    let primeRatioEmploi = 0;
    if (ratio > 3) primeRatioEmploi = 10;
    else if (ratio > 1.5) primeRatioEmploi = 7;
    else if (ratio > 1) primeRatioEmploi = 5;

    const primeGenre = projectData.partFemmesPct >= 30 ? 3 : 0;
    // Vérifier si c'est un métier d'avenir (secteurs technologiques)
    const secteursMetiersAvenir = ['Technologie numérique & Secteur numérique', 'Industrie pharmaceutique', 'Mobilité'];
    const primeMetiersAvenir = secteursMetiersAvenir.includes(projectData.secteur) ? 3 : 0;
    const primeDD = projectData.criteresDD.includes('Système d\'économie d\'eau (obligatoire)') && 
                    projectData.criteresDD.length >= 3 ? 3 : 0;

    // Prime intégration locale
    const tauxIntegration = projectData.chiffreAffaires > 0 
      ? ((projectData.achatLocaux + projectData.valeurAjoutee + projectData.margeBrute) / projectData.chiffreAffaires) * 100
      : 0;
    const seuilSectoriel = ['pharmaceutique', 'agricole'].some(s => 
      projectData.secteur.toLowerCase().includes(s)) ? 20 : 40;
    const primeIntegration = tauxIntegration >= seuilSectoriel ? 3 : 0;

    // Tous les secteurs industriels sont prioritaires selon la nouvelle liste
    const primeSectorielle = projectData.secteur !== '' ? 5 : 0;
    
    let primeTerritoriale = 0;
    if (PROVINCES_A.includes(projectData.province)) primeTerritoriale = 10;
    else if (PROVINCES_B.includes(projectData.province)) primeTerritoriale = 15;

    const totalPrimesPct = primeRatioEmploi + primeGenre + primeMetiersAvenir + 
                          primeDD + primeIntegration + primeSectorielle + primeTerritoriale;
    const totalPrimesAjustePct = Math.min(totalPrimesPct, 30);
    const montantPrimesMAD = (mip * totalPrimesAjustePct) / 100;

    const simulationResult: SimulationResult = {
      mip,
      primeRatioEmploi,
      primeGenre,
      primeMetiersAvenir,
      primeDD,
      primeIntegration,
      primeSectorielle,
      primeTerritoriale,
      totalPrimesPct,
      totalPrimesAjustePct,
      montantPrimesMAD
    };

    setResult(simulationResult);
    
    // Envoyer au backend pour sauvegarde
    saveSimulation(simulationResult);
  };

  const saveSimulation = async (simulationResult: SimulationResult) => {
    try {
      const response = await fetch('/api/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'principal',
          projectData,
          result: simulationResult,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        console.warn('Erreur sauvegarde simulation:', response.status);
      }
    } catch (error) {
      console.warn('Erreur réseau sauvegarde:', error);
    }
  };

  // Rendu des étapes
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderTermsAndConditions();
      case 1:
        return renderEligibilityStep();
      case 2:
        return renderSecteurStep();
      case 3:
        return renderMetierStep();
      case 4:
        return renderRegionStep();
      case 5:
        return renderProvinceStep();
      case 6:
        return renderProjetStep();
      case 7:
        return renderCapexStep();
      case 8:
        return renderPrimesStep();
      case 9:
        return renderResultsStep();
      default:
        return null;
    }
  };

  const renderEligibilityStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-semibold mb-4 text-industria-brown-gold">Critères d'éligibilité</h3>
        <p className="text-gray-600">Vérifiez que votre projet répond aux conditions suivantes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Critères obligatoires */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg text-green-700 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">✓</div>
              Critères obligatoires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
              <div>
                <p className="font-medium text-green-800">Montant d'investissement</p>
                <p className="text-sm text-green-700">&ge; 50 000 000 MAD</p>
                <p className="text-xs text-gray-600 mt-1">Investissement total minimum requis</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
              <div>
                <p className="font-medium text-green-800">Emplois stables</p>
                <p className="text-sm text-green-700">&ge; 50 emplois</p>
                <p className="text-xs text-gray-600 mt-1">Emplois stables à créer minimum</p>
              </div>
            </div>

            <Alert className="bg-green-100 border-green-300">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Important :</strong> Ces deux critères sont indispensables pour être éligible aux primes d'investissement.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Cas spéciaux */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-700 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">i</div>
              Cas spéciaux
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
              <div>
                <p className="font-medium text-blue-800">Projets &lt; 150 emplois</p>
                <p className="text-xs text-gray-600 mt-1">Modalités d'aide spécifiques selon le secteur</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
              <div>
                <p className="font-medium text-blue-800">Projets &ge; 150 emplois</p>
                <p className="text-xs text-gray-600 mt-1">Conditions préférentielles et primes majorées</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
              <div>
                <p className="font-medium text-blue-800">TPE/PME</p>
                <p className="text-xs text-gray-600 mt-1">Dispositifs spéciaux Intelaka et Moussanada</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rubriques éligibles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800">Rubriques d'investissement éligibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-industria-brown-gold"></div>
                <span className="text-sm">Frais d'étude et R&D</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-industria-brown-gold"></div>
                <span className="text-sm">Frais de transfert de technologie</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-industria-brown-gold"></div>
                <span className="text-sm">Acquisition foncier (privé/public)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-industria-brown-gold"></div>
                <span className="text-sm">Acquisition/Location bâtiment</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-industria-brown-gold"></div>
                <span className="text-sm">Infrastructures externes/internes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-industria-brown-gold"></div>
                <span className="text-sm">Constructions/Génie civil</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-industria-brown-gold"></div>
                <span className="text-sm">Équipements et outillages</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-industria-brown-gold"></div>
                <span className="text-sm">Aménagements spécialisés</span>
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
              <h4 className="font-semibold text-gray-700 text-sm">Primes de base</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Ratio emploi/CAPEX</span>
                  <Badge variant="secondary" className="text-xs">5-10%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Prime genre</span>
                  <Badge variant="secondary" className="text-xs">3%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Métiers d'avenir</span>
                  <Badge variant="secondary" className="text-xs">3%</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 text-sm">Primes sectorielles</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Prime sectorielle</span>
                  <Badge variant="secondary" className="text-xs">5%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Développement durable</span>
                  <Badge variant="secondary" className="text-xs">3%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Intégration locale</span>
                  <Badge variant="secondary" className="text-xs">3%</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 text-sm">Primes territoriales</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Catégorie A</span>
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">10%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Catégorie B</span>
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">15%</Badge>
                </div>
              </div>
            </div>
          </div>
          
          <Alert className="mt-4 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Plafond légal :</strong> Le total des primes ne peut dépasser 30% du MIP (Montant d'Investissement Productif).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Processus */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-gray-800">Processus de validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-industria-brown-gold text-white flex items-center justify-center mx-auto mb-2 font-bold">1</div>
              <p className="text-sm font-medium">Simulation</p>
              <p className="text-xs text-gray-600">Calcul indicatif en ligne</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-industria-brown-gold text-white flex items-center justify-center mx-auto mb-2 font-bold">2</div>
              <p className="text-sm font-medium">Dossier</p>
              <p className="text-xs text-gray-600">Constitution des justificatifs</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-industria-brown-gold text-white flex items-center justify-center mx-auto mb-2 font-bold">3</div>
              <p className="text-sm font-medium">Examen</p>
              <p className="text-xs text-gray-600">Validation par CRUI</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-industria-brown-gold text-white flex items-center justify-center mx-auto mb-2 font-bold">4</div>
              <p className="text-sm font-medium">Convention</p>
              <p className="text-xs text-gray-600">Signature et décaissement</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTermsAndConditions = () => (
    <div className="space-y-6">
      {/* Conditions d'utilisation */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-4">
            <h4 className="font-semibold">Conditions d'utilisation</h4>
            <div className="text-sm space-y-2">
              <p>• Ce simulateur est fourni à titre informatif uniquement</p>
              <p>• Les résultats sont basés sur la réglementation en vigueur</p>
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

  const renderSecteurStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Sélectionnez votre secteur d'activité</h3>
        <p className="text-gray-600">Choisissez le secteur qui correspond le mieux à votre projet</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.keys(SECTEURS_METIERS).map((secteur) => (
          <Card 
            key={secteur} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              projectData.secteur === secteur ? 'ring-2 ring-industria-brown-gold bg-industria-brown-gold/5' : ''
            }`}
            onClick={() => setProjectData({...projectData, secteur, metier: ''})}
          >
            <CardContent className="p-4">
              <h4 className="font-medium text-sm">{secteur}</h4>
              <p className="text-xs text-gray-500 mt-1">
                {SECTEURS_METIERS[secteur as keyof typeof SECTEURS_METIERS].length} métiers disponibles
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderMetierStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Choisissez votre métier spécialisé</h3>
        <p className="text-gray-600">Secteur sélectionné : <strong>{projectData.secteur}</strong></p>
      </div>
      <div className="space-y-3">
        {projectData.secteur && SECTEURS_METIERS[projectData.secteur as keyof typeof SECTEURS_METIERS]?.map((metier) => (
          <Card 
            key={metier}
            className={`cursor-pointer transition-all hover:shadow-md ${
              projectData.metier === metier ? 'ring-2 ring-industria-brown-gold bg-industria-brown-gold/5' : ''
            }`}
            onClick={() => setProjectData({...projectData, metier})}
          >
            <CardContent className="p-4">
              <p className="text-sm font-medium">{metier}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderRegionStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Sélectionnez votre région</h3>
        <p className="text-gray-600">Choisissez la région où se situe votre projet</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.keys(REGIONS_PROVINCES).map((region) => (
          <Card 
            key={region}
            className={`cursor-pointer transition-all hover:shadow-md ${
              projectData.region === region ? 'ring-2 ring-industria-brown-gold bg-industria-brown-gold/5' : ''
            }`}
            onClick={() => setProjectData({...projectData, region, province: ''})}
          >
            <CardContent className="p-4">
              <h4 className="font-medium text-sm">{region}</h4>
              <p className="text-xs text-gray-500 mt-1">
                {REGIONS_PROVINCES[region as keyof typeof REGIONS_PROVINCES].length} provinces
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
        <h3 className="text-xl font-semibold mb-2">Choisissez votre province</h3>
        <p className="text-gray-600">Région sélectionnée : <strong>{projectData.region}</strong></p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {projectData.region && REGIONS_PROVINCES[projectData.region as keyof typeof REGIONS_PROVINCES]?.map((province) => {
          const isProvinceA = PROVINCES_A.includes(province);
          const isProvinceB = PROVINCES_B.includes(province);
          const primeInfo = isProvinceA ? '+10%' : isProvinceB ? '+15%' : '0%';
          const primeColor = isProvinceA ? 'text-blue-600' : isProvinceB ? 'text-green-600' : 'text-gray-500';
          
          return (
            <Card 
              key={province}
              className={`cursor-pointer transition-all hover:shadow-md ${
                projectData.province === province ? 'ring-2 ring-industria-brown-gold bg-industria-brown-gold/5' : ''
              }`}
              onClick={() => setProjectData({...projectData, province})}
            >
              <CardContent className="p-3">
                <p className="text-sm font-medium">{province}</p>
                <p className={`text-xs font-semibold mt-1 ${primeColor}`}>
                  Prime territoriale: {primeInfo}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderProjetStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Données de votre projet</h3>
        <p className="text-gray-600">Renseignez les informations principales de votre investissement</p>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="montantTotal">Montant total investissement (MAD)</Label>
          <Input
            id="montantTotal"
            type="number"
            value={projectData.montantTotal || ''}
            onChange={(e) => setProjectData({...projectData, montantTotal: Number(e.target.value)})}
            placeholder="50 000 000 minimum"
          />
          {projectData.montantTotal > 0 && projectData.montantTotal < 50000000 && (
            <p className="text-red-500 text-xs mt-1">Minimum requis : 50 000 000 MAD</p>
          )}
        </div>
        <div>
          <Label htmlFor="emploisStables">Emplois stables à créer</Label>
          <Input
            id="emploisStables"
            type="number"
            value={projectData.emploisStables || ''}
            onChange={(e) => setProjectData({...projectData, emploisStables: Number(e.target.value)})}
            placeholder="50 minimum"
          />
          {projectData.emploisStables > 0 && projectData.emploisStables < 50 && (
            <p className="text-red-500 text-xs mt-1">Minimum requis : 50 emplois</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderCapexStep = () => {
    // Calculer la somme de la ventilation CAPEX
    const sommeCAPEX = projectData.fraisEtude + projectData.foncierPrive + 
                       projectData.foncierPublic + projectData.constructions + 
                       projectData.equipements;
    
    const ecartMontant = Math.abs(sommeCAPEX - projectData.montantTotal);
    const pourcentageEcart = projectData.montantTotal > 0 ? 
      (ecartMontant / projectData.montantTotal) * 100 : 0;
    
    const isCoherent = ecartMontant <= (projectData.montantTotal * 0.01); // Tolérance de 1%

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Répartition de votre CAPEX</h3>
          <p className="text-gray-600">Détaillez la répartition de votre investissement (optionnel)</p>
        </div>

        {/* Récapitulatif montant total */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Montant total à ventiler :</strong> {projectData.montantTotal.toLocaleString('fr-FR')} MAD
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fraisEtude">Frais d'étude, R&D (MAD)</Label>
            <Input
              id="fraisEtude"
              type="number"
              value={projectData.fraisEtude || ''}
              onChange={(e) => setProjectData({...projectData, fraisEtude: Number(e.target.value)})}
            />
          </div>
          <div>
            <Label htmlFor="foncierPrive">Foncier privé (MAD)</Label>
            <Input
              id="foncierPrive"
              type="number"
              value={projectData.foncierPrive || ''}
              onChange={(e) => setProjectData({...projectData, foncierPrive: Number(e.target.value)})}
            />
          </div>
          <div>
            <Label htmlFor="foncierPublic">Foncier public (MAD)</Label>
            <Input
              id="foncierPublic"
              type="number"
              value={projectData.foncierPublic || ''}
              onChange={(e) => setProjectData({...projectData, foncierPublic: Number(e.target.value)})}
            />
          </div>
          <div>
            <Label htmlFor="constructions">Constructions/Génie civil (MAD)</Label>
            <Input
              id="constructions"
              type="number"
              value={projectData.constructions || ''}
              onChange={(e) => setProjectData({...projectData, constructions: Number(e.target.value)})}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="equipements">Équipements & outillages (MAD)</Label>
            <Input
              id="equipements"
              type="number"
              value={projectData.equipements || ''}
              onChange={(e) => setProjectData({...projectData, equipements: Number(e.target.value)})}
            />
          </div>
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
                  <p className="font-medium">{projectData.montantTotal.toLocaleString('fr-FR')} MAD</p>
                </div>
                <div>
                  <p className="text-gray-600">Somme des rubriques</p>
                  <p className="font-medium">{sommeCAPEX.toLocaleString('fr-FR')} MAD</p>
                </div>
                <div>
                  <p className="text-gray-600">Écart</p>
                  <p className={`font-medium ${
                    ecartMontant > 0 
                      ? (isCoherent ? 'text-green-700' : 'text-orange-700')
                      : 'text-gray-700'
                  }`}>
                    {ecartMontant.toLocaleString('fr-FR')} MAD
                    {pourcentageEcart > 0 && (
                      <span className="text-xs ml-1">
                        ({pourcentageEcart.toFixed(1)}%)
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Taux de ventilation</p>
                  <p className="font-medium">
                    {projectData.montantTotal > 0 
                      ? ((sommeCAPEX / projectData.montantTotal) * 100).toFixed(1)
                      : 0
                    }%
                  </p>
                </div>
              </div>

              {!isCoherent && ecartMontant > 0 && (
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Auto-correction proportionnelle
                        const ratio = projectData.montantTotal / sommeCAPEX;
                        setProjectData({
                          ...projectData,
                          fraisEtude: Math.round(projectData.fraisEtude * ratio),
                          foncierPrive: Math.round(projectData.foncierPrive * ratio),
                          foncierPublic: Math.round(projectData.foncierPublic * ratio),
                          constructions: Math.round(projectData.constructions * ratio),
                          equipements: Math.round(projectData.equipements * ratio)
                        });
                      }}
                      className="text-xs"
                    >
                      Correction proportionnelle
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Ajuster le dernier élément (équipements)
                        const autresRubriques = projectData.fraisEtude + projectData.foncierPrive + 
                                               projectData.foncierPublic + projectData.constructions;
                        const nouveauxEquipements = Math.max(0, projectData.montantTotal - autresRubriques);
                        setProjectData({
                          ...projectData,
                          equipements: nouveauxEquipements
                        });
                      }}
                      className="text-xs"
                    >
                      Ajuster équipements
                    </Button>
                  </div>
                </div>
              )}

              {sommeCAPEX === 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Répartition automatique suggérée
                      setProjectData({
                        ...projectData,
                        fraisEtude: Math.round(projectData.montantTotal * 0.05), // 5%
                        foncierPrive: Math.round(projectData.montantTotal * 0.15), // 15%
                        foncierPublic: 0,
                        constructions: Math.round(projectData.montantTotal * 0.30), // 30%
                        equipements: Math.round(projectData.montantTotal * 0.50) // 50%
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

  const renderPrimesStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Primes spécifiques</h3>
        <p className="text-gray-600">Informations pour calculer les primes additionnelles</p>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="partFemmes">Part de femmes dans la masse salariale (%)</Label>
          <Input
            id="partFemmes"
            type="number"
            max="100"
            value={projectData.partFemmesPct || ''}
            onChange={(e) => setProjectData({...projectData, partFemmesPct: Number(e.target.value)})}
            placeholder="Minimum 30% pour prime genre"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="achatLocaux">Achats locaux (MAD/an)</Label>
            <Input
              id="achatLocaux"
              type="number"
              value={projectData.achatLocaux || ''}
              onChange={(e) => setProjectData({...projectData, achatLocaux: Number(e.target.value)})}
            />
          </div>
          <div>
            <Label htmlFor="chiffreAffaires">Chiffre d'affaires prévisionnel (MAD/an)</Label>
            <Input
              id="chiffreAffaires"
              type="number"
              value={projectData.chiffreAffaires || ''}
              onChange={(e) => setProjectData({...projectData, chiffreAffaires: Number(e.target.value)})}
            />
          </div>
        </div>
        
        <div>
          <Label>Critères développement durable</Label>
          <div className="mt-2 space-y-2">
            {CRITERES_DD.map((critere) => (
              <div key={critere} className="flex items-center space-x-2">
                <Checkbox
                  id={critere}
                  checked={projectData.criteresDD.includes(critere)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setProjectData({...projectData, criteresDD: [...projectData.criteresDD, critere]});
                    } else {
                      setProjectData({...projectData, criteresDD: projectData.criteresDD.filter(c => c !== critere)});
                    }
                  }}
                />
                <Label htmlFor={critere} className="text-sm">
                  {critere}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderResultsStep = () => {
    if (!result) {
      calculatePrimes();
      return <div className="text-center py-8">Calcul en cours...</div>;
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Résultats de votre simulation</h3>
          <p className="text-gray-600">Estimation de vos primes d'investissement</p>
        </div>
        
        <div className="bg-gradient-to-r from-industria-brown-gold/10 to-industria-olive-light/10 p-6 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600">Montant total des primes</p>
            <p className="text-4xl font-bold text-industria-brown-gold">
              {result.montantPrimesMAD.toLocaleString('fr-FR')} MAD
            </p>
            <p className="text-sm text-gray-600 mt-2">
              ({result.totalPrimesAjustePct}% du MIP)
            </p>
          </div>
        </div>

        {/* Détails des primes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Récapitulatif projet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Secteur:</span>
                <span className="font-medium">{projectData.secteur}</span>
              </div>
              <div className="flex justify-between">
                <span>Métier:</span>
                <span className="font-medium text-xs">{projectData.metier}</span>
              </div>
              <div className="flex justify-between">
                <span>Localisation:</span>
                <span className="font-medium">{projectData.province}</span>
              </div>
              <div className="flex justify-between">
                <span>Investissement:</span>
                <span className="font-medium">{projectData.montantTotal.toLocaleString('fr-FR')} MAD</span>
              </div>
              <div className="flex justify-between">
                <span>Emplois:</span>
                <span className="font-medium">{projectData.emploisStables}</span>
              </div>
              <div className="flex justify-between">
                <span>MIP:</span>
                <span className="font-medium">{result.mip.toLocaleString('fr-FR')} MAD</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Détail des primes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.primeRatioEmploi > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm">Prime ratio emploi/CAPEX</span>
                  <Badge variant="secondary">{result.primeRatioEmploi}%</Badge>
                </div>
              )}
              {result.primeGenre > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm">Prime genre</span>
                  <Badge variant="secondary">{result.primeGenre}%</Badge>
                </div>
              )}
              {result.primeMetiersAvenir > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm">Prime métiers d'avenir</span>
                  <Badge variant="secondary">{result.primeMetiersAvenir}%</Badge>
                </div>
              )}
              {result.primeSectorielle > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm">Prime sectorielle</span>
                  <Badge variant="secondary">{result.primeSectorielle}%</Badge>
                </div>
              )}
              {result.primeTerritoriale > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm">Prime territoriale</span>
                  <Badge variant="secondary">{result.primeTerritoriale}%</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
                  <Calculator className="w-8 h-8 text-industria-brown-gold" />
                  Simulateur de Dispositif Principal
                </CardTitle>
                <p className="text-lg text-gray-600">
                  Calculez vos primes d'investissement selon la Charte de l'investissement du Maroc
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {renderTermsAndConditions()}
                
                <div className="text-center">
                  <Button 
                    onClick={handleStartSimulation}
                    disabled={!acceptedTerms || !acceptedDisclaimer}
                    className="bg-gradient-to-r from-industria-brown-gold to-industria-olive-light hover:from-industria-olive-light hover:to-industria-brown-gold text-white px-8 py-3"
                  >
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Commencer la simulation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-900">Simulateur de Dispositif Principal</h2>
              <Badge variant="outline" className="px-3 py-1">
                Étape {currentStep + 1} sur {steps.length}
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-industria-brown-gold to-industria-olive-light h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{steps[currentStep]}</p>
          </div>

          {/* Contenu de l'étape */}
          <Card>
            <CardContent className="p-8">
              {renderStep()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button 
              onClick={handlePrevStep}
              disabled={currentStep === 0}
              variant="outline"
              className="px-6"
            >
              Précédent
            </Button>
            
            <div className="flex gap-3">
              {currentStep === steps.length - 1 ? (
                <Button 
                  onClick={() => window.location.reload()}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6"
                >
                  Nouvelle simulation
                </Button>
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