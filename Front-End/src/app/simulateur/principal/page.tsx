'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Calculator, FileText, TrendingUp, Download } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';

// Types pour le simulateur
interface ProjectData {
  // Secteurs
  secteurSectorielle: string; // Pour prime sectorielle
  metierAvenir: string; // Pour prime métiers d'avenir
  activiteSpecifique?: string; // Activité d'avenir spécifique sélectionnée
  // Localisation
  region: string;
  province: string;
  // Projet
  montantTotal: number;
  emploisStables: number;
  // CAPEX
  fraisEtude: number;
  foncierPrive: number;
  foncierPublic: number;
  constructions: number;
  equipements: number;
  // Primes spécifiques
  partFemmesPct: number;
  criteresDD: string[];
  critereDDObligatoire: boolean;
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

// Secteurs consolidés avec leurs secteurs porteurs
const SECTEURS_CONSOLIDES = {
  'Tourisme et loisir': {
    prime: 5,
    secteursPorteurs: []
  },
  'Industrie': {
    prime: 5,
    secteursPorteurs: [
      'Industrie automobile',
      'Industrie aéronautique', 
      'Industrie agricole / agro-alimentaire',
      'Industrie diversifiée',
      'Industrie Maritime',
      'Industrie pharmaceutique',
      'Secteur minier',
      'Industrie du textile et du cuir',
      'Autres secteurs'
    ]
  },
  'Logistique': {
    prime: 5,
    secteursPorteurs: []
  },
  'Industrie culturelle': {
    prime: 5,
    secteursPorteurs: []
  },
  'Numérique': {
    prime: 5,
    secteursPorteurs: [
      'Technologie numérique & Secteur numérique'
    ]
  },
  'Transport': {
    prime: 5,
    secteursPorteurs: [
      'Mobilité'
    ]
  },
  'Outsourcing': {
    prime: 5,
    secteursPorteurs: []
  },
  'Aquaculture': {
    prime: 5,
    secteursPorteurs: []
  },
  'Énergie renouvelable': {
    prime: 5,
    secteursPorteurs: [
      'Industrie énergies renouvelables',
      'Transition énergétique'
    ]
  },
  'Transformation et valorisation des déchets': {
    prime: 5,
    secteursPorteurs: []
  }
};

// Métiers spécialisés d'avenir (pour prime 3% supplémentaire)
const METIERS_SPECIALISES = {
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
  'Industrie agricole / agro-alimentaire': [
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
  'Transition énergétique': [
    'Fabrication d\'équipements de dessalement d\'eau de mer'
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

// Critère obligatoire pour la prime DD
const CRITERE_DD_OBLIGATOIRE = 'Utilisation des eaux non conventionnelles telles que les eaux recyclées, les eaux usées retraitées ou les eaux dessalées et mise en place d\'un système d\'économie d\'eau';

// Critères optionnels pour la prime DD (minimum 2 requis en plus de l'obligatoire)
const CRITERES_DD_OPTIONNELS = [
  'Énergies renouvelables',
  'Efficacité énergétique',
  'Traitement des déchets',
  'Programmes sociaux',
  'Certification environnementale',
  'Gestion durable des ressources naturelles',
  'Formation et sensibilisation environnementale'
];

// Fonction pour formater les nombres avec des espaces comme séparateurs de milliers
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

// Fonction pour parser un nombre formaté avec des espaces
const parseFormattedNumber = (str: string): number => {
  return parseInt(str.replace(/\s/g, '')) || 0;
};

export default function SimulateurPrincipal() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [projectData, setProjectData] = useState<ProjectData>({
    secteurSectorielle: '',
    metierAvenir: '',
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
    critereDDObligatoire: false,
    achatLocaux: 0,
    valeurAjoutee: 0,
    margeBrute: 0,
    chiffreAffaires: 0,
  });
  const [result, setResult] = useState<SimulationResult | null>(null);

  // Reset result whenever projectData changes to ensure recalculation
  useEffect(() => {
    setResult(null);
  }, [projectData]);

  // Generate PDF export of simulation results
  const exportToPDF = () => {
    if (!result) return;

    // Create a new window with the PDF content
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentDate = new Date().toLocaleDateString('fr-FR');
    const montantFormate = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Simulateur d'Investissement - Résultats</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 40px; 
            line-height: 1.6; 
            color: #333;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #8B4513; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
          }
          .header h1 { 
            color: #8B4513; 
            font-size: 24px; 
            margin: 0; 
          }
          .header p { 
            color: #666; 
            font-size: 14px; 
            margin: 5px 0; 
          }
          .section { 
            margin-bottom: 25px; 
            page-break-inside: avoid; 
          }
          .section-title { 
            background: linear-gradient(135deg, #8B4513, #A0522D); 
            color: white; 
            padding: 10px 15px; 
            font-size: 16px; 
            font-weight: bold; 
            margin-bottom: 15px; 
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
            margin-bottom: 15px; 
          }
          .info-item { 
            padding: 8px; 
            border-left: 4px solid #8B4513; 
            background: #f9f9f9; 
          }
          .info-label { 
            font-weight: bold; 
            color: #8B4513; 
          }
          .primes-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px; 
          }
          .primes-table th, .primes-table td { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: left; 
          }
          .primes-table th { 
            background: #8B4513; 
            color: white; 
            font-weight: bold; 
          }
          .prime-eligible { 
            background: #e8f5e8; 
            color: #2d5a2d; 
          }
          .prime-non-eligible { 
            background: #ffeaea; 
            color: #8b4513; 
          }
          .total-row { 
            font-weight: bold; 
            background: #f0f0f0; 
          }
          .footer { 
            margin-top: 40px; 
            text-align: center; 
            font-size: 12px; 
            color: #666; 
            border-top: 1px solid #ddd; 
            padding-top: 20px; 
          }
          @media print { 
            body { margin: 20px; } 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SIMULATEUR D'INVESTISSEMENT - RÉSULTATS</h1>
          <p>Dispositif Principal d'Aide à l'Investissement</p>
          <p>Généré le ${currentDate}</p>
        </div>

        <div class="section">
          <div class="section-title">📊 Récapitulatif du Projet</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Secteur d'activité</div>
              <div>${projectData.secteurSectorielle || 'Non spécifié'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Métier d'avenir</div>
              <div>${projectData.metierAvenir || 'Non spécifié'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Localisation</div>
              <div>${projectData.region} - ${projectData.province}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Montant total</div>
              <div>${montantFormate(projectData.montantTotal)} MAD</div>
            </div>
            <div class="info-item">
              <div class="info-label">Emplois stables</div>
              <div>${projectData.emploisStables} emplois</div>
            </div>
            <div class="info-item">
              <div class="info-label">MIP</div>
              <div>${montantFormate(Math.round(result.mip))} MAD</div>
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
              <tr class="${result.primeRatioEmploi > 0 ? 'prime-eligible' : 'prime-non-eligible'}">
                <td>Prime ratio emploi/CAPEX</td>
                <td>${result.primeRatioEmploi}%</td>
                <td>${result.primeRatioEmploi > 0 ? 'Éligible' : 'Non éligible'}</td>
              </tr>
              <tr class="${result.primeGenre > 0 ? 'prime-eligible' : 'prime-non-eligible'}">
                <td>Prime genre (≥30% femmes)</td>
                <td>${result.primeGenre}%</td>
                <td>${result.primeGenre > 0 ? 'Éligible' : 'Non éligible'}</td>
              </tr>
              <tr class="${result.primeSectorielle > 0 ? 'prime-eligible' : 'prime-non-eligible'}">
                <td>Prime sectorielle</td>
                <td>${result.primeSectorielle}%</td>
                <td>${result.primeSectorielle > 0 ? 'Éligible' : 'Non éligible'}</td>
              </tr>
              <tr class="${result.primeMetiersAvenir > 0 ? 'prime-eligible' : 'prime-non-eligible'}">
                <td>Prime métiers d'avenir</td>
                <td>${result.primeMetiersAvenir}%</td>
                <td>${result.primeMetiersAvenir > 0 ? 'Éligible' : 'Non éligible'}</td>
              </tr>
              <tr class="${result.primeDD > 0 ? 'prime-eligible' : 'prime-non-eligible'}">
                <td>Prime développement durable</td>
                <td>${result.primeDD}%</td>
                <td>${result.primeDD > 0 ? 'Éligible' : 'Non éligible'}</td>
              </tr>
              <tr class="${result.primeIntegration > 0 ? 'prime-eligible' : 'prime-non-eligible'}">
                <td>Prime intégration locale</td>
                <td>${result.primeIntegration}%</td>
                <td>${result.primeIntegration > 0 ? 'Éligible' : 'Non éligible'}</td>
              </tr>
              <tr class="${result.primeTerritoriale > 0 ? 'prime-eligible' : 'prime-non-eligible'}">
                <td>Prime territoriale</td>
                <td>${result.primeTerritoriale}%</td>
                <td>${result.primeTerritoriale > 0 ? 'Éligible' : 'Non éligible'}</td>
              </tr>
              <tr class="total-row">
                <td><strong>Total des primes (plafonné à 30%)</strong></td>
                <td><strong>${result.totalPrimesAjustePct}%</strong></td>
                <td><strong>${montantFormate(Math.round(result.montantPrimesMAD))} MAD</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">💰 Résumé Financier</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Montant d'investissement total</div>
              <div>${montantFormate(projectData.montantTotal)} MAD</div>
            </div>
            <div class="info-item">
              <div class="info-label">Montant d'investissement primable (MIP)</div>
              <div>${montantFormate(Math.round(result.mip))} MAD</div>
            </div>
            <div class="info-item">
              <div class="info-label">Taux de prime total</div>
              <div>${result.totalPrimesAjustePct}%</div>
            </div>
            <div class="info-item">
              <div class="info-label">Montant de la prime estimée</div>
              <div><strong>${montantFormate(Math.round(result.montantPrimesMAD))} MAD</strong></div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p><strong>INDUSTRIA</strong> - Simulateur d'Investissement</p>
          <p>Ce document est une estimation basée sur les informations fournies. Les montants définitifs sont soumis à validation officielle.</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then trigger print dialog
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const steps = [
    'Conditions d\'utilisation',
    'Critères d\'éligibilité',
    'Région',
    'Province',
    'Données projet',
    'Répartition CAPEX',
    'Prime ratio emploi/CAPEX',
    'Prime genre',
    'Secteur d\'activité',
    'Métiers spécialisés',
    'Prime développement durable',
    'Prime intégration locale',
    'Résultats'
  ];

  const handleStartSimulation = () => {
    if (acceptedTerms && acceptedDisclaimer) {
      setCurrentStep(1);
    }
  };

  // Détermine si l'étape Activités d'avenir doit être ignorée
  const shouldSkipMetiersAvenirStep = () => {
    if (!projectData.secteurSectorielle) return false;
    if (projectData.secteurSectorielle === 'Pas dans la liste') return true;
    
    const secteurConfig = SECTEURS_CONSOLIDES[projectData.secteurSectorielle as keyof typeof SECTEURS_CONSOLIDES];
    if (!secteurConfig || secteurConfig.secteursPorteurs.length === 0) return true;
    
    // Si "Pas dans la liste" est sélectionné pour le métier d'avenir, ignorer l'étape suivante
    if (projectData.metierAvenir === 'Pas dans la liste') return true;
    
    return false;
  };

  // Calcule le nombre total d'étapes effectives et la position actuelle
  const getEffectiveStepInfo = () => {
    const totalSteps = steps.length;
    const skippedSteps = shouldSkipMetiersAvenirStep() ? 1 : 0;
    const effectiveTotalSteps = totalSteps - skippedSteps;
    
    let effectiveCurrentStep = currentStep + 1;
    if (currentStep > 9 && shouldSkipMetiersAvenirStep()) {
      effectiveCurrentStep = currentStep; // Réduire de 1 car étape 9 ignorée
    }
    
    return { effectiveCurrentStep, effectiveTotalSteps };
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      let nextStep = currentStep + 1;
      
      // Skip step 9 (métiers d'avenir) if no secteurs porteurs available
      if (nextStep === 9 && shouldSkipMetiersAvenirStep()) {
        nextStep = 10;
      }
      
      setCurrentStep(nextStep);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      let prevStep = currentStep - 1;
      
      // Skip step 9 (métiers d'avenir) if no secteurs porteurs available
      if (prevStep === 9 && shouldSkipMetiersAvenirStep()) {
        prevStep = 8;
      }
      
      setCurrentStep(prevStep);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return true; // Critères d'éligibilité - juste informatif
      case 2: return projectData.region !== '';
      case 3: return projectData.province !== '';
      case 4: return (projectData.montantTotal >= 50000000 && projectData.emploisStables >= 50) || projectData.emploisStables >= 150;
      case 5: return true; // CAPEX est optionnel pour continuer
      case 6: return true; // Prime ratio emploi/CAPEX - automatique
      case 7: return true; // Prime genre - optionnelle
      case 8: return projectData.secteurSectorielle !== ''; // Secteur d'activité
      case 9: return true; // Prime métiers d'avenir - optionnelle
      case 10: return true; // Prime DD - optionnelle
      case 11: return true; // Prime intégration locale - optionnelle
      default: return true;
    }
  };

  const calculatePrimes = () => {
    // Vérifications d'éligibilité : SOIT (50M MAD ET 50 emplois) OU 150 emplois
    const eligibleByAmount = projectData.montantTotal >= 50000000 && projectData.emploisStables >= 50;
    const eligibleByEmployment = projectData.emploisStables >= 150;
    
    if (!eligibleByAmount && !eligibleByEmployment) {
      alert('Projet non éligible : Il faut SOIT (50M MAD minimum ET 50 emplois stables) OU 150 emplois stables minimum');
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
    // Prime métiers d'avenir si activité spécifique sélectionnée
    const primeMetiersAvenir = projectData.activiteSpecifique && 
                              projectData.activiteSpecifique !== 'Pas dans la liste' ? 3 : 0;
    const primeDD = projectData.critereDDObligatoire && projectData.criteresDD.length >= 2 ? 3 : 0;

    // Prime intégration locale
    const tauxIntegration = projectData.chiffreAffaires > 0 
      ? ((projectData.achatLocaux + projectData.valeurAjoutee + projectData.margeBrute) / projectData.chiffreAffaires) * 100
      : 0;
    const seuilSectoriel = (projectData.metierAvenir && 
      (['pharmaceutique', 'agricole'].some(s => 
        projectData.metierAvenir?.toLowerCase().includes(s)) || 
        projectData.metierAvenir?.toLowerCase().includes('fournitures médicales'))) ? 20 : 40;
    const primeIntegration = tauxIntegration >= seuilSectoriel ? 3 : 0;

    // Prime sectorielle selon le secteur sélectionné
    const primeSectorielle = projectData.secteurSectorielle && projectData.secteurSectorielle !== 'Pas dans la liste' ? 5 : 0;
    
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
        return renderRegionStep();
      case 3:
        return renderProvinceStep();
      case 4:
        return renderProjetStep();
      case 5:
        return renderCapexStep();
      case 6:
        return renderPrimeRatioEmploiStep();
      case 7:
        return renderPrimeGenreStep();
      case 8:
        return renderPrimeSectorielleStep();
      case 9:
        return renderPrimeMetiersAvenirStep();
      case 10:
        return renderPrimeDDStep();
      case 11:
        return renderPrimeIntegrationStep();
      case 12:
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

      {/* Critères d'éligibilité unifiés */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-lg text-green-700 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">✓</div>
            Critères d'éligibilité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-green-800 text-center">Conditions d'éligibilité</h4>
              <div className="text-center text-gray-700 mb-4">
                Votre projet doit remplir <strong>l'une des deux conditions suivantes :</strong>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 1 */}
                <div className="p-4 border-2 border-green-300 rounded-lg bg-green-100">
                  <h5 className="font-semibold text-green-800 mb-3 text-center">Option 1</h5>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-600"></div>
                      <span className="text-sm text-green-800">≥ 50 000 000 MAD</span>
                    </div>
                    <div className="text-center text-green-700 font-semibold">ET</div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-600"></div>
                      <span className="text-sm text-green-800">≥ 50 emplois stables</span>
                    </div>
                  </div>
                </div>
                
                {/* Option 2 */}
                <div className="p-4 border-2 border-blue-300 rounded-lg bg-blue-100">
                  <h5 className="font-semibold text-blue-800 mb-3 text-center">Option 2</h5>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      <span className="text-sm text-blue-800">≥ 150 emplois stables</span>
                    </div>
                    <div className="text-xs text-gray-600 text-center">
                      (pas de condition de montant minimum)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Alert className="bg-blue-100 border-blue-300 mt-4">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Important :</strong> Votre projet doit respecter l'une des deux conditions ci-dessus pour être éligible aux primes d'investissement.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

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
                  <span className="text-sm">Secteurs industriels</span>
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">5%</Badge>
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
              <strong>Plafond légal :</strong> Le total des primes ne peut dépasser 30% du MIP (Montant d'Investissement Primable).
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
              <p className="text-xs text-gray-600">Signature de la convention</p>
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
            type="text"
            value={projectData.montantTotal ? formatNumber(projectData.montantTotal) : ''}
            onChange={(e) => {
              const numValue = parseFormattedNumber(e.target.value);
              setProjectData({...projectData, montantTotal: numValue});
            }}
            placeholder="Montant investissement"
          />
          {projectData.montantTotal > 0 && projectData.emploisStables > 0 && projectData.montantTotal < 50000000 && projectData.emploisStables < 150 && (
            <p className="text-red-500 text-xs mt-1">Pour être éligible : SOIT ≥50M MAD ET ≥50 emplois, OU ≥150 emplois</p>
          )}
        </div>
        <div>
          <Label htmlFor="emploisStables">Emplois stables à créer</Label>
          <Input
            id="emploisStables"
            type="text"
            value={projectData.emploisStables ? formatNumber(projectData.emploisStables) : ''}
            onChange={(e) => {
              const numValue = parseFormattedNumber(e.target.value);
              setProjectData({...projectData, emploisStables: numValue});
            }}
            placeholder="Nombre d'emplois stables"
          />
          {projectData.montantTotal > 0 && projectData.emploisStables > 0 && projectData.montantTotal < 50000000 && projectData.emploisStables < 150 && (
            <p className="text-red-500 text-xs mt-1">Pour être éligible : SOIT ≥50M MAD ET ≥50 emplois, OU ≥150 emplois</p>
          )}
        </div>
      </div>
      
      {/* Validation des critères d'éligibilité */}
      {projectData.montantTotal > 0 && projectData.emploisStables > 0 && (
        <Alert className={`${
          (projectData.montantTotal >= 50000000 && projectData.emploisStables >= 50) || projectData.emploisStables >= 150
            ? 'bg-green-100 border-green-300' 
            : 'bg-orange-100 border-orange-300'
        }`}>
          <AlertCircle className={`h-4 w-4 ${
            (projectData.montantTotal >= 50000000 && projectData.emploisStables >= 50) || projectData.emploisStables >= 150
              ? 'text-green-600' 
              : 'text-orange-600'
          }`} />
          <AlertDescription className={`${
            (projectData.montantTotal >= 50000000 && projectData.emploisStables >= 50) || projectData.emploisStables >= 150
              ? 'text-green-800' 
              : 'text-orange-800'
          }`}>
            {(projectData.montantTotal >= 50000000 && projectData.emploisStables >= 50) || projectData.emploisStables >= 150 ? (
              <>
                <strong>✓ Projet éligible !</strong>
                {projectData.emploisStables >= 150 ? 
                  ` Condition remplie : ${formatNumber(projectData.emploisStables)} emplois ≥ 150` :
                  ` Condition remplie : ${formatNumber(projectData.montantTotal)} MAD ≥ 50M ET ${formatNumber(projectData.emploisStables)} emplois ≥ 50`
                }
              </>
            ) : (
              <>
                <strong>⚠ Critères d'éligibilité non remplis</strong>
                <br />Il faut SOIT (≥50M MAD ET ≥50 emplois) OU ≥150 emplois
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
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

    // Calcul du MIP (Montant d'Investissement Primable)
    const partFoncierPrivePct = projectData.montantTotal > 0 ? 
      (projectData.foncierPrive / projectData.montantTotal) * 100 : 0;
    const mip = partFoncierPrivePct <= 20 
      ? projectData.montantTotal - projectData.foncierPublic
      : (projectData.montantTotal - projectData.foncierPrive - projectData.foncierPublic) + (0.20 * projectData.montantTotal);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Répartition de votre CAPEX</h3>
          <p className="text-gray-600">Détaillez la répartition de votre investissement (optionnel)</p>
        </div>

        {/* Information MIP */}
        <Alert className="bg-indigo-50 border-indigo-200">
          <AlertCircle className="h-4 w-4 text-indigo-600" />
          <AlertDescription className="text-indigo-800">
            <strong>MIP (Montant d'Investissement Primable) :</strong> Il s'agit du montant sur lequel seront calculées les primes d'investissement. 
            Le MIP exclut certains éléments comme le foncier public et applique des limitations sur le foncier privé (max 20% de l'investissement total).
          </AlertDescription>
        </Alert>

        {/* Récapitulatif montant total */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Montant total à ventiler :</strong> {formatNumber(projectData.montantTotal)} MAD
          </AlertDescription>
        </Alert>

        {/* Affichage du MIP calculé */}
        {projectData.montantTotal > 0 && (
          <Alert className="bg-green-50 border-green-200">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <div>
                  <strong>Montant d'Investissement Primable (MIP) :</strong> {formatNumber(Math.max(0, mip))} MAD
                </div>
                <div className="text-sm text-green-700">
                  {partFoncierPrivePct <= 20 ? (
                    <>Calcul : Investissement total ({formatNumber(projectData.montantTotal)} MAD) - Foncier public ({formatNumber(projectData.foncierPublic)} MAD)</>
                  ) : (
                    <>Calcul : Foncier privé plafonné à 20% + Autres investissements - Foncier public<br/>
                    <span className="text-orange-600">⚠ Foncier privé dépasse 20% ({partFoncierPrivePct.toFixed(1)}%), limitation appliquée</span></>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fraisEtude">Frais d'étude, R&D (MAD)</Label>
            <Input
              id="fraisEtude"
              type="text"
              value={projectData.fraisEtude ? formatNumber(projectData.fraisEtude) : ''}
              onChange={(e) => {
                const numValue = parseFormattedNumber(e.target.value);
                setProjectData({...projectData, fraisEtude: numValue});
              }}
            />
          </div>
          <div>
            <Label htmlFor="foncierPrive">Foncier privé (MAD)</Label>
            <Input
              id="foncierPrive"
              type="text"
              value={projectData.foncierPrive ? formatNumber(projectData.foncierPrive) : ''}
              onChange={(e) => {
                const numValue = parseFormattedNumber(e.target.value);
                setProjectData({...projectData, foncierPrive: numValue});
              }}
            />
            <p className="text-xs text-blue-600 mt-1">Peut inclure les 5 premières années de loyer</p>
          </div>
          <div>
            <Label htmlFor="foncierPublic">Foncier public (MAD)</Label>
            <Input
              id="foncierPublic"
              type="text"
              value={projectData.foncierPublic ? formatNumber(projectData.foncierPublic) : ''}
              onChange={(e) => {
                const numValue = parseFormattedNumber(e.target.value);
                setProjectData({...projectData, foncierPublic: numValue});
              }}
            />
            <p className="text-xs text-red-600 mt-1">Non pris en compte dans le montant primable</p>
          </div>
          <div>
            <Label htmlFor="constructions">Constructions/Génie civil (MAD)</Label>
            <Input
              id="constructions"
              type="text"
              value={projectData.constructions ? formatNumber(projectData.constructions) : ''}
              onChange={(e) => {
                const numValue = parseFormattedNumber(e.target.value);
                setProjectData({...projectData, constructions: numValue});
              }}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="equipements">Équipements & outillages (MAD)</Label>
            <Input
              id="equipements"
              type="text"
              value={projectData.equipements ? formatNumber(projectData.equipements) : ''}
              onChange={(e) => {
                const numValue = parseFormattedNumber(e.target.value);
                setProjectData({...projectData, equipements: numValue});
              }}
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

  // Calcul des primes individuelles pour affichage
  const calculateIndividualPrime = (primeType: string) => {
    const capexEnMDH = projectData.montantTotal / 1000000;
    const ratio = projectData.emploisStables / capexEnMDH;

    switch (primeType) {
      case 'ratioEmploi':
        if (ratio > 3) return 10;
        else if (ratio > 1.5) return 7;
        else if (ratio > 1) return 5;
        return 0;
      
      case 'genre':
        return projectData.partFemmesPct >= 30 ? 3 : 0;
      
      case 'metiersAvenir':
        return projectData.activiteSpecifique && 
               projectData.activiteSpecifique !== 'Pas dans la liste' ? 3 : 0;
      
      case 'dd':
        return projectData.critereDDObligatoire && projectData.criteresDD.length >= 2 ? 3 : 0;
      
      case 'integration':
        const tauxIntegration = projectData.chiffreAffaires > 0 
          ? ((projectData.achatLocaux + projectData.valeurAjoutee + projectData.margeBrute) / projectData.chiffreAffaires) * 100
          : 0;
        const seuilSectoriel = (projectData.metierAvenir && 
          (['pharmaceutique', 'agricole'].some(s => 
            projectData.metierAvenir?.toLowerCase().includes(s)) || 
            projectData.metierAvenir?.toLowerCase().includes('fournitures médicales'))) ? 20 : 40;
        return tauxIntegration >= seuilSectoriel ? 3 : 0;
      
      case 'sectorielle':
        if (!projectData.secteurSectorielle || projectData.secteurSectorielle === 'Pas dans la liste') return 0;
        const secteurConfig = SECTEURS_CONSOLIDES[projectData.secteurSectorielle as keyof typeof SECTEURS_CONSOLIDES];
        return secteurConfig ? secteurConfig.prime : 0;
      
      case 'territoriale':
        if (PROVINCES_A.includes(projectData.province)) return 10;
        else if (PROVINCES_B.includes(projectData.province)) return 15;
        return 0;
      
      default:
        return 0;
    }
  };

  const renderPrimeRatioEmploiStep = () => {
    const capexEnMDH = projectData.montantTotal / 1000000;
    const ratio = projectData.emploisStables / capexEnMDH;
    const primeCalculee = calculateIndividualPrime('ratioEmploi');
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-semibold mb-4 text-industria-brown-gold">Prime Ratio Emploi/CAPEX</h3>
          <p className="text-gray-600">Calculée automatiquement selon le ratio emplois créés / investissement</p>
        </div>

        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Calcul automatique
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Investissement total</p>
                <p className="text-2xl font-bold text-blue-700">{capexEnMDH.toFixed(1)} MDH</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Emplois stables</p>
                <p className="text-2xl font-bold text-blue-700">{projectData.emploisStables}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Ratio</p>
                <p className="text-2xl font-bold text-blue-700">{ratio.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg">
              <h4 className="font-semibold mb-4">Grille de calcul</h4>
              <div className="space-y-3">
                <div className={`flex justify-between items-center p-3 rounded ${ratio > 3 ? 'bg-green-100 border-2 border-green-300' : 'bg-gray-50'}`}>
                  <span>Ratio &gt; 3</span>
                  <Badge variant={ratio > 3 ? 'default' : 'secondary'} className={ratio > 3 ? 'bg-green-600' : ''}>10%</Badge>
                </div>
                <div className={`flex justify-between items-center p-3 rounded ${ratio > 1.5 && ratio <= 3 ? 'bg-green-100 border-2 border-green-300' : 'bg-gray-50'}`}>
                  <span>Ratio &gt; 1.5</span>
                  <Badge variant={ratio > 1.5 && ratio <= 3 ? 'default' : 'secondary'} className={ratio > 1.5 && ratio <= 3 ? 'bg-green-600' : ''}>7%</Badge>
                </div>
                <div className={`flex justify-between items-center p-3 rounded ${ratio > 1 && ratio <= 1.5 ? 'bg-green-100 border-2 border-green-300' : 'bg-gray-50'}`}>
                  <span>Ratio &gt; 1</span>
                  <Badge variant={ratio > 1 && ratio <= 1.5 ? 'default' : 'secondary'} className={ratio > 1 && ratio <= 1.5 ? 'bg-green-600' : ''}>5%</Badge>
                </div>
                <div className={`flex justify-between items-center p-3 rounded ${ratio <= 1 ? 'bg-red-100 border-2 border-red-300' : 'bg-gray-50'}`}>
                  <span>Ratio ≤ 1</span>
                  <Badge variant={ratio <= 1 ? 'destructive' : 'secondary'}>0%</Badge>
                </div>
              </div>
            </div>

            <Alert className={`${primeCalculee > 0 ? 'bg-green-100 border-green-300' : 'bg-orange-100 border-orange-300'}`}>
              <AlertCircle className={`h-4 w-4 ${primeCalculee > 0 ? 'text-green-600' : 'text-orange-600'}`} />
              <AlertDescription className={`${primeCalculee > 0 ? 'text-green-800' : 'text-orange-800'}`}>
                <strong>Résultat :</strong> Prime ratio emploi/CAPEX = {primeCalculee}%
                {primeCalculee === 0 && ' - Non éligible (ratio trop faible)'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPrimeGenreStep = () => {
    const primeCalculee = calculateIndividualPrime('genre');
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-semibold mb-4 text-industria-brown-gold">Prime Genre</h3>
          <p className="text-gray-600">3% si au moins 30% de femmes dans la masse salariale</p>
        </div>

        <Card className="border-2 border-pink-200 bg-pink-50">
          <CardHeader>
            <CardTitle className="text-xl text-pink-700">Part de femmes dans la masse salariale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="partFemmes">Pourcentage de femmes (%)</Label>
              <Input
                id="partFemmes"
                type="number"
                max="100"
                min="0"
                value={projectData.partFemmesPct || ''}
                onChange={(e) => setProjectData({...projectData, partFemmesPct: Number(e.target.value)})}
                placeholder="Saisissez le pourcentage"
                className="mt-2"
              />
            </div>

            <div className="bg-white p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Seuil requis</span>
                <Badge variant="secondary">≥ 30%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Votre pourcentage</span>
                <Badge variant={projectData.partFemmesPct >= 30 ? 'default' : 'destructive'} 
                       className={projectData.partFemmesPct >= 30 ? 'bg-green-600' : ''}>
                  {projectData.partFemmesPct || 0}%
                </Badge>
              </div>
            </div>

            <Alert className={`${primeCalculee > 0 ? 'bg-green-100 border-green-300' : 'bg-orange-100 border-orange-300'}`}>
              <AlertCircle className={`h-4 w-4 ${primeCalculee > 0 ? 'text-green-600' : 'text-orange-600'}`} />
              <AlertDescription className={`${primeCalculee > 0 ? 'text-green-800' : 'text-orange-800'}`}>
                <strong>Résultat :</strong> Prime genre = {primeCalculee}%
                {primeCalculee === 0 && ' - Augmentez la part de femmes à 30% minimum'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  };
  const renderPrimeMetiersAvenirStep = () => {
    const secteurPorteurSelectionne = projectData.metierAvenir;
    const metiersDisponibles = secteurPorteurSelectionne && METIERS_SPECIALISES[secteurPorteurSelectionne as keyof typeof METIERS_SPECIALISES] || [];
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-semibold mb-4 text-industria-brown-gold">Activités d'avenir / Montée en gamme</h3>
          <p className="text-gray-600">Sélectionnez votre activité spécifique pour +3%</p>
        </div>

        {secteurPorteurSelectionne ? (
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-lg text-purple-700">
                Activités disponibles pour {secteurPorteurSelectionne}
              </CardTitle>
              <p className="text-sm text-purple-600">Choisissez votre activité spécifique pour bénéficier de la prime de 3%</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {metiersDisponibles.map((metier, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded cursor-pointer transition-all hover:shadow-md ${
                      projectData.activiteSpecifique === metier 
                        ? 'bg-purple-100 border-2 border-purple-300 font-semibold' 
                        : 'bg-white hover:bg-purple-50'
                    }`}
                    onClick={() => {
                      setProjectData({
                        ...projectData, 
                        activiteSpecifique: metier
                      });
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{metier}</span>
                      {projectData.activiteSpecifique === metier && (
                        <Badge className="bg-purple-600">3%</Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Option "Pas dans la liste" */}
                <div
                  className={`p-3 rounded cursor-pointer transition-all hover:shadow-md ${
                    projectData.activiteSpecifique === 'Pas dans la liste' 
                      ? 'bg-gray-100 border-2 border-gray-300 font-semibold' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setProjectData({
                      ...projectData, 
                      activiteSpecifique: 'Pas dans la liste'
                    });
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pas dans la liste</span>
                    {projectData.activiteSpecifique === 'Pas dans la liste' && (
                      <Badge variant="secondary">0%</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-gray-200 bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg text-gray-700">
                Aucun secteur porteur sélectionné
              </CardTitle>
              <p className="text-sm text-gray-600">Pas de secteur porteur ou "Pas dans la liste" sélectionné dans l'étape précédente</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-100 border-blue-300">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Information :</strong> Votre secteur d'activité n'a pas de secteurs porteurs définis ou vous avez choisi "Pas dans la liste". 
                  Vous pouvez continuer sans activité d'avenir (prime = 0%).
                </AlertDescription>
              </Alert>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Vous pouvez passer à l'étape suivante sans sélectionner d'activité d'avenir.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Alert className={`${
          projectData.activiteSpecifique ? 'bg-green-100 border-green-300' : 'bg-orange-100 border-orange-300'
        }`}>
          <AlertCircle className={`h-4 w-4 ${
            projectData.activiteSpecifique ? 'text-green-600' : 'text-orange-600'
          }`} />
          <AlertDescription className={`${
            projectData.activiteSpecifique ? 'text-green-800' : 'text-orange-800'
          }`}>
            {projectData.activiteSpecifique ? (
              (projectData.activiteSpecifique === 'Pas dans la liste') ? (
                <>
                  <strong>✓ Sélection:</strong> {projectData.activiteSpecifique}
                  <br />
                  <strong>Prime métiers d'avenir: 0%</strong>
                </>
              ) : (
                <>
                  <strong>✓ Activité sélectionnée:</strong> {projectData.activiteSpecifique}
                  <br />
                  <strong>Prime métiers d'avenir: +3%</strong>
                </>
              )
            ) : (
              <>
                <strong>Aucune activité sélectionnée.</strong> 
                Sélectionnez une activité d'avenir pour bénéficier de la prime de 3%, ou choisissez une option à 0% pour continuer sans prime.
              </>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  const renderPrimeDDStep = () => {
    const primeCalculee = projectData.critereDDObligatoire && projectData.criteresDD.length >= 2 ? 3 : 0;
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-semibold mb-4 text-industria-brown-gold">Prime Développement Durable</h3>
          <p className="text-gray-600">3% pour le critère obligatoire + 2 critères optionnels minimum</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Carte du critère obligatoire */}
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg text-green-700">Critère Obligatoire en utilisation d'eau non conventionnelles</CardTitle>
              <p className="text-sm text-green-600">Ce critère est obligatoire pour obtenir la prime DD</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-3 p-3 rounded bg-white">
                <Checkbox
                  id="critere-obligatoire"
                  checked={projectData.critereDDObligatoire}
                  onCheckedChange={(checked) => {
                    setProjectData({...projectData, critereDDObligatoire: !!checked});
                  }}
                />
                <Label htmlFor="critere-obligatoire" className="text-sm leading-5 cursor-pointer">
                  {CRITERE_DD_OBLIGATOIRE}
                </Label>
              </div>
              
              <Alert className={`mt-4 ${
                projectData.critereDDObligatoire ? 'bg-green-100 border-green-300' : 'bg-orange-100 border-orange-300'
              }`}>
                <AlertCircle className={`h-4 w-4 ${
                  projectData.critereDDObligatoire ? 'text-green-600' : 'text-orange-600'
                }`} />
                <AlertDescription className={`${
                  projectData.critereDDObligatoire ? 'text-green-800' : 'text-orange-800'
                }`}>
                  {projectData.critereDDObligatoire 
                    ? '✓ Critère obligatoire validé' 
                    : '⚠ Critère obligatoire requis'
                  }
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Carte des critères optionnels */}
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg text-green-700">Critères Obligatoire en développement durable et énérgie</CardTitle>
              <p className="text-sm text-green-600">Sélectionnez au minimum 2 critères supplémentaires</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {CRITERES_DD_OPTIONNELS.map((critere) => (
                  <div key={critere} className="flex items-center space-x-2 p-2 rounded bg-white">
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
                    <Label htmlFor={critere} className="text-sm cursor-pointer">
                      {critere}
                    </Label>
                  </div>
                ))}
              </div>
              
              <Alert className={`mt-4 ${
                projectData.criteresDD.length >= 2 ? 'bg-green-100 border-green-300' : 'bg-orange-100 border-orange-300'
              }`}>
                <AlertCircle className={`h-4 w-4 ${
                  projectData.criteresDD.length >= 2 ? 'text-green-600' : 'text-orange-600'
                }`} />
                <AlertDescription className={`${
                  projectData.criteresDD.length >= 2 ? 'text-green-800' : 'text-orange-800'
                }`}>
                  <strong>Critères sélectionnés :</strong> {projectData.criteresDD.length} / 2 minimum
                  {projectData.criteresDD.length >= 2 
                    ? ' ✓ Objectif atteint' 
                    : ` ⚠ Choisissez ${2 - projectData.criteresDD.length} critère(s) supplémentaire(s)`
                  }
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Résumé global */}
        <Alert className={`${primeCalculee > 0 ? 'bg-green-100 border-green-300' : 'bg-orange-100 border-orange-300'}`}>
          <AlertCircle className={`h-4 w-4 ${primeCalculee > 0 ? 'text-green-600' : 'text-orange-600'}`} />
          <AlertDescription className={`${primeCalculee > 0 ? 'text-green-800' : 'text-orange-800'}`}>
            <strong>Résultat :</strong> Prime Développement Durable = {primeCalculee}%
            {primeCalculee > 0 ? (
              <> - Critère obligatoire ✓ + {projectData.criteresDD.length} critères optionnels</>
            ) : (
              <>
                {!projectData.critereDDObligatoire && ' - Critère obligatoire manquant'}
                {projectData.critereDDObligatoire && projectData.criteresDD.length < 2 && ' - Critères optionnels insuffisants'}
              </>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  const renderPrimeIntegrationStep = () => {
    const primeCalculee = calculateIndividualPrime('integration');
    const tauxIntegration = projectData.chiffreAffaires > 0 
      ? ((projectData.achatLocaux + projectData.valeurAjoutee + projectData.margeBrute) / projectData.chiffreAffaires) * 100
      : 0;
    const seuilSectoriel = (projectData.metierAvenir && 
      (['pharmaceutique', 'agricole'].some(s => 
        projectData.metierAvenir?.toLowerCase().includes(s)) || 
        projectData.metierAvenir?.toLowerCase().includes('fournitures médicales'))) ? 20 : 40;
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-semibold mb-4 text-industria-brown-gold">Prime Intégration Locale</h3>
          <p className="text-gray-600">3% si taux d'intégration locale ≥ seuil sectoriel</p>
        </div>

        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-700">Taux d'intégration locale</CardTitle>
            <p className="text-sm text-blue-600">Formule: (Achats domestiques + Valeur ajoutée + Marge brute) / Chiffre d'Affaires</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="achatLocaux">Achats domestiques (MAD/an)</Label>
                <Input
                  id="achatLocaux"
                  type="text"
                  value={projectData.achatLocaux ? formatNumber(projectData.achatLocaux) : ''}
                  onChange={(e) => {
                    const numValue = parseFormattedNumber(e.target.value);
                    setProjectData({...projectData, achatLocaux: numValue});
                  }}
                />
              </div>
              <div>
                <Label htmlFor="chiffreAffaires">Chiffre d'affaires prévisionnel (MAD/an)</Label>
                <Input
                  id="chiffreAffaires"
                  type="text"
                  value={projectData.chiffreAffaires ? formatNumber(projectData.chiffreAffaires) : ''}
                  onChange={(e) => {
                    const numValue = parseFormattedNumber(e.target.value);
                    setProjectData({...projectData, chiffreAffaires: numValue});
                  }}
                />
              </div>
              <div>
                <Label htmlFor="valeurAjoutee">Valeur ajoutée (MAD/an)</Label>
                <Input
                  id="valeurAjoutee"
                  type="text"
                  value={projectData.valeurAjoutee ? formatNumber(projectData.valeurAjoutee) : ''}
                  onChange={(e) => {
                    const numValue = parseFormattedNumber(e.target.value);
                    setProjectData({...projectData, valeurAjoutee: numValue});
                  }}
                />
              </div>
              <div>
                <Label htmlFor="margeBrute">Marge brute (MAD/an)</Label>
                <Input
                  id="margeBrute"
                  type="text"
                  value={projectData.margeBrute ? formatNumber(projectData.margeBrute) : ''}
                  onChange={(e) => {
                    const numValue = parseFormattedNumber(e.target.value);
                    setProjectData({...projectData, margeBrute: numValue});
                  }}
                />
              </div>
            </div>
            
            {/* Calcul du taux en temps réel */}
            {projectData.chiffreAffaires > 0 && (
              <Alert className="bg-white border-blue-300">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>Taux calculé: <strong>{tauxIntegration.toFixed(1)}%</strong></p>
                    </div>
                    <div>
                      <p>Seuil requis: <strong>
                        {seuilSectoriel}%
                        {projectData.metierAvenir?.toLowerCase().includes('pharmaceutique') ? ' (Pharmaceutique)' : 
                         projectData.metierAvenir?.toLowerCase().includes('agricole') ? ' (Agro-alimentaire)' : 
                         projectData.metierAvenir?.toLowerCase().includes('fournitures médicales') ? ' (Fournitures médicales)' : ' (Autres secteurs)'}
                      </strong></p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Alert className={`${primeCalculee > 0 ? 'bg-green-100 border-green-300' : 'bg-orange-100 border-orange-300'}`}>
              <AlertCircle className={`h-4 w-4 ${primeCalculee > 0 ? 'text-green-600' : 'text-orange-600'}`} />
              <AlertDescription className={`${primeCalculee > 0 ? 'text-green-800' : 'text-orange-800'}`}>
                <strong>Résultat :</strong> Prime intégration locale = {primeCalculee}%
                {primeCalculee === 0 && projectData.chiffreAffaires > 0 && 
                  ` - Taux insuffisant (${tauxIntegration.toFixed(1)}% < ${seuilSectoriel}%)`}
                {primeCalculee === 0 && projectData.chiffreAffaires === 0 && 
                  ' - Renseignez vos données financières'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPrimeSectorielleStep = () => {
    const secteurConfig = projectData.secteurSectorielle ? 
      SECTEURS_CONSOLIDES[projectData.secteurSectorielle as keyof typeof SECTEURS_CONSOLIDES] : null;
    const selectedSecteurPorteur = projectData.metierAvenir; // Réutilise pour secteur porteur
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-semibold mb-4 text-industria-brown-gold">Secteur d'activité</h3>
          <p className="text-gray-600">1. Choisissez d'abord votre secteur principal</p>
        </div>

        {/* Sélection secteur principal */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-700">Secteur d'activité (5%)</CardTitle>
            <p className="text-sm text-blue-600">Sélectionnez votre secteur d'activité principal</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(SECTEURS_CONSOLIDES).map(([secteur, config]) => (
                <div
                  key={secteur}
                  className={`p-3 rounded cursor-pointer transition-all hover:shadow-md ${
                    projectData.secteurSectorielle === secteur 
                      ? 'bg-blue-100 border-2 border-blue-300 font-semibold' 
                      : 'bg-white hover:bg-blue-50'
                  }`}
                  onClick={() => {
                    setProjectData({
                      ...projectData, 
                      secteurSectorielle: secteur,
                      metierAvenir: '', // Reset secteur porteur
                      activiteSpecifique: '' // Reset activité spécifique
                    });
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{secteur}</span>
                    {projectData.secteurSectorielle === secteur && (
                      <Badge className="bg-blue-600">5%</Badge>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Option "Pas dans la liste" */}
              <div
                className={`p-3 rounded cursor-pointer transition-all hover:shadow-md ${
                  projectData.secteurSectorielle === 'Pas dans la liste' 
                    ? 'bg-gray-100 border-2 border-gray-300 font-semibold' 
                    : 'bg-white hover:bg-gray-50'
                }`}
                onClick={() => {
                  setProjectData({
                    ...projectData, 
                    secteurSectorielle: 'Pas dans la liste',
                    metierAvenir: '', // Reset secteur porteur
                    activiteSpecifique: '' // Reset activité spécifique
                  });
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pas dans la liste</span>
                  {projectData.secteurSectorielle === 'Pas dans la liste' && (
                    <Badge variant="secondary">0%</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Option générique pour secteur porteur si "Pas dans la liste" sélectionné - SUPPRIMÉ */}
        {false && projectData.secteurSectorielle === 'Pas dans la liste' && (
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-lg text-purple-700">
                2. Secteur porteur (optionnel)
              </CardTitle>
              <p className="text-sm text-purple-600">Vous pouvez tout de même sélectionner un secteur porteur</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Tous les secteurs porteurs disponibles */}
                {Object.values(SECTEURS_CONSOLIDES).flatMap(config => config.secteursPorteurs).map((secteurPorteur) => (
                  <div
                    key={secteurPorteur}
                    className={`p-2 rounded cursor-pointer transition-all hover:shadow-sm ${
                      projectData.metierAvenir === secteurPorteur 
                        ? 'bg-purple-100 border-2 border-purple-300 font-semibold' 
                        : 'bg-white hover:bg-purple-50'
                    }`}
                    onClick={() => setProjectData({
                      ...projectData, 
                      metierAvenir: projectData.metierAvenir === secteurPorteur ? '' : secteurPorteur
                    })}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs">{secteurPorteur}</span>
                      {projectData.metierAvenir === secteurPorteur && (
                        <Badge className="bg-purple-600">+3%</Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Option "Pas dans la liste" */}
                <div
                  className={`p-2 rounded cursor-pointer transition-all hover:shadow-sm ${
                    projectData.metierAvenir === 'Pas dans la liste' 
                      ? 'bg-gray-100 border-2 border-gray-300 font-semibold' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => setProjectData({
                    ...projectData, 
                    metierAvenir: projectData.metierAvenir === 'Pas dans la liste' ? '' : 'Pas dans la liste'
                  })}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Pas dans la liste</span>
                    {projectData.metierAvenir === 'Pas dans la liste' && (
                      <Badge variant="secondary">0%</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sélection secteur porteur si disponible */}
        {projectData.secteurSectorielle && projectData.secteurSectorielle !== 'Pas dans la liste' && secteurConfig && secteurConfig.secteursPorteurs.length > 0 && (
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-lg text-purple-700">
                2. Métier d'avenir / Montée en gamme pour {projectData.secteurSectorielle}
              </CardTitle>
              <p className="text-sm text-purple-600">Optionnel : Sélectionnez un secteur porteur pour 3% supplémentaire</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {secteurConfig.secteursPorteurs.map((secteurPorteur) => (
                  <div
                    key={secteurPorteur}
                    className={`p-2 rounded cursor-pointer transition-all hover:shadow-sm ${
                      selectedSecteurPorteur === secteurPorteur 
                        ? 'bg-purple-100 border-2 border-purple-300 font-semibold' 
                        : 'bg-white hover:bg-purple-50'
                    }`}
                    onClick={() => setProjectData({
                      ...projectData, 
                      metierAvenir: selectedSecteurPorteur === secteurPorteur ? '' : secteurPorteur
                    })}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs">{secteurPorteur}</span>
                    </div>
                  </div>
                ))}
                
                {/* Option "Pas dans la liste" pour secteurs porteurs */}
                <div
                  className={`p-2 rounded cursor-pointer transition-all hover:shadow-sm ${
                    selectedSecteurPorteur === 'Pas dans la liste' 
                      ? 'bg-gray-100 border-2 border-gray-300 font-semibold' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => setProjectData({
                    ...projectData, 
                    metierAvenir: selectedSecteurPorteur === 'Pas dans la liste' ? '' : 'Pas dans la liste'
                  })}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Pas dans la liste</span>
                    {selectedSecteurPorteur === 'Pas dans la liste' && (
                      <Badge variant="secondary">0%</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Résumé */}
        {projectData.secteurSectorielle && (
          <Alert className={`${projectData.secteurSectorielle === 'Pas dans la liste' ? 'bg-gray-100 border-gray-300' : 'bg-green-100 border-green-300'}`}>
            <AlertCircle className={`h-4 w-4 ${projectData.secteurSectorielle === 'Pas dans la liste' ? 'text-gray-600' : 'text-green-600'}`} />
            <AlertDescription className={`${projectData.secteurSectorielle === 'Pas dans la liste' ? 'text-gray-800' : 'text-green-800'}`}>
              <strong>Secteur principal : </strong> {projectData.secteurSectorielle} 
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };


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
                <span className="font-medium">{projectData.secteurSectorielle}</span>
              </div>
              <div className="flex justify-between">
                <span>Métier:</span>
                <span className="font-medium">{projectData.metierAvenir}</span>
              </div>
              <div className="flex justify-between">
                <span>Métier d'avenir:</span>
                <span className="font-medium">{projectData.activiteSpecifique?.trim() || "-"}</span>
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
            <CardContent className="space-y-3">
              {/* Primes obtenues */}
              <div>
                <h4 className="font-semibold text-green-700 text-sm mb-2">✓ Primes obtenues</h4>
                <div className="space-y-2">
                  {result.primeRatioEmploi > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-sm">Prime ratio emploi/CAPEX</span>
                      <Badge variant="default" className="bg-green-600">{result.primeRatioEmploi}%</Badge>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Prime ratio emploi/CAPEX</span>
                      <Badge variant="destructive">Non éligible</Badge>
                    </div>
                  )}
                  
                  {result.primeGenre > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-sm">Prime genre</span>
                      <Badge variant="default" className="bg-green-600">{result.primeGenre}%</Badge>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Prime genre</span>
                      <Badge variant="destructive">Non éligible</Badge>
                    </div>
                  )}
                  
                  {result.primeMetiersAvenir > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-sm">Prime métiers d'avenir</span>
                      <Badge variant="default" className="bg-green-600">{result.primeMetiersAvenir}%</Badge>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Prime métiers d'avenir</span>
                      <Badge variant="destructive">Non éligible</Badge>
                    </div>
                  )}
                  
                  {result.primeSectorielle > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-sm">Prime sectorielle</span>
                      <Badge variant="default" className="bg-green-600">{result.primeSectorielle}%</Badge>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Prime sectorielle</span>
                      <Badge variant="destructive">Non éligible</Badge>
                    </div>
                  )}
                  
                  {result.primeDD > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-sm">Prime développement durable</span>
                      <Badge variant="default" className="bg-green-600">{result.primeDD}%</Badge>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Prime développement durable</span>
                      <Badge variant="destructive">Non éligible</Badge>
                    </div>
                  )}
                  
                  {result.primeIntegration > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-sm">Prime intégration locale</span>
                      <Badge variant="default" className="bg-green-600">{result.primeIntegration}%</Badge>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Prime intégration locale</span>
                      <Badge variant="destructive">Non éligible</Badge>
                    </div>
                  )}
                  
                  {result.primeTerritoriale > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-sm">Prime territoriale</span>
                      <Badge variant="default" className="bg-green-600">{result.primeTerritoriale}%</Badge>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Prime territoriale</span>
                      <Badge variant="destructive">Non éligible</Badge>
                    </div>
                  )}
                </div>
              </div>
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
                Étape {getEffectiveStepInfo().effectiveCurrentStep} sur {getEffectiveStepInfo().effectiveTotalSteps}
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-industria-brown-gold to-industria-olive-light h-2 rounded-full transition-all duration-500"
                style={{ width: `${(getEffectiveStepInfo().effectiveCurrentStep / getEffectiveStepInfo().effectiveTotalSteps) * 100}%` }}
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