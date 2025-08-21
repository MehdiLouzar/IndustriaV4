'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Calculator, FileText, TrendingUp, Building2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';

// Types pour l'Axe 2 - Mesures d'amélioration du climat des affaires
interface ProjectDataAxe2 {
  // Données entreprise
  typeEntreprise: 'TPE' | 'PME' | 'GRANDE' | '';
  secteurActivite: string;
  chiffreAffairesAnnuel: number;
  effectifTotal: number;
  province: string;
  
  // Données projet
  montantTotal: number;
  emploisStables: number;
  
  // Mesures sélectionnées (7 mesures Axe 2)
  mesuresSelectionnees: string[];
  
  // Détails par mesure
  logistique: {
    besoinTransport: boolean;
    volumesAnnuels: number;
    coutLogistiqueActuel: number;
  };
  energie: {
    consommationkWh: number;
    typeEnergie: string;
    installationPrevue: string;
  };
  rd: {
    budgetRD: number;
    partenariat: boolean;
    typeInnovation: string;
  };
  financement: {
    besoinFinancement: number;
    typeFinancement: string;
    garantiesDisponibles: boolean;
  };
  foncier: {
    surfaceNecessaire: number;
    typeFoncier: string;
    budgetFoncier: number;
  };
  formation: {
    nombrePersonnes: number;
    typeFormation: string;
    budgetFormation: number;
  };
  
  // Investissements détaillés
  investissementEquipement: number;
  investissementFormation: number;
  investissementInnovation: number;
  investissementLogistique: number;
  investissementEnergie: number;
  investissementFoncier: number;
  investissementDigitalisation: number;
}

interface SimulationResultAxe2 {
  eligibilite: boolean;
  raisonIneligibilite?: string;
  mesuresApprouvees: Array<{
    mesure: string;
    typeAide: string;
    montantAide: number;
    conditions: string[];
  }>;
  montantTotalAides: number;
  tempsTraitementEstime: number;
  documentRequis: string[];
  indicateursKPI: Array<{
    indicateur: string;
    cible: string;
    delai: string;
  }>;
}

// Activités éligibles Axe 2 selon documentation
const ACTIVITES_ELIGIBLES = [
  'Industrie manufacturière (automobile, aéronautique, pharma)',
  'Énergies renouvelables (production, stockage, équipements)',
  'TIC & services numériques (data centers, cloud, cybersécurité)',
  'Logistique & transport (hubs, cold chain, plateformes)',
  'Agritech & agroalimentaire (transformation, équipements)',
  'Santé & biotechnologie (R&D, principes actifs)',
  'Culture & industries créatives (audiovisuel, jeux)',
  'Aquaculture & transformation pêche',
  'Recyclage & économie circulaire',
  'Construction d\'infrastructures industrielles'
];

// 7 Mesures de l'Axe 2
const MESURES_AXE2 = [
  {
    id: 'logistique',
    nom: 'Compétitivité logistique',
    description: 'Réduire coût/temps logistique, accès ports et zones',
    aides: ['Subvention infrastructures', 'Exonérations douanières', 'Accès zone prioritaire']
  },
  {
    id: 'energie',
    nom: 'Énergies renouvelables',
    description: 'Production décentralisée (solaire, éolien, biomasse)',
    aides: ['Aide à l\'investissement', 'Bonus tarifaires', 'Facilités financement']
  },
  {
    id: 'rd',
    nom: 'R&D et innovation',
    description: 'Partenariats université-industrie, prototypage',
    aides: ['Subvention R&D', 'Crédit d\'impôt recherche', 'Partage coût']
  },
  {
    id: 'financement',
    nom: 'Accès aux financements',
    description: 'Garanties publiques, fonds co-investissement',
    aides: ['Garanties bancaires', 'Prêts mezzanine', 'Fonds souverains']
  },
  {
    id: 'digitalisation',
    nom: 'Digitalisation formalités',
    description: 'Guichets uniques numériques, e-signature',
    aides: ['Réduction délais', 'API dédiées', 'Formation agents']
  },
  {
    id: 'foncier',
    nom: 'Foncier compétitif',
    description: 'Terrains industriels à prix attractifs',
    aides: ['Prix préférentiels', 'Bail emphytéotique', 'Viabilisation']
  },
  {
    id: 'formation',
    nom: 'Formation & compétences',
    description: 'Programmes en adéquation avec besoins',
    aides: ['Co-financement formation', 'Alternance', 'Certification']
  }
];

// Critères TPE/PME selon la réglementation marocaine
const TYPE_ENTREPRISE_CRITERES = {
  TPE: {
    effectifMax: 10,
    chiffreAffairesMax: 3000000, // 3M MAD
    description: 'Très Petite Entreprise (≤10 salariés, CA≤3M MAD)'
  },
  PME: {
    effectifMax: 200,
    chiffreAffairesMax: 175000000, // 175M MAD
    description: 'Petite et Moyenne Entreprise (≤200 salariés, CA≤175M MAD)'
  }
};

export default function SimulateurAxe2() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [projectData, setProjectData] = useState<ProjectDataAxe2>({
    // Données entreprise
    typeEntreprise: '',
    secteurActivite: '',
    chiffreAffairesAnnuel: 0,
    effectifTotal: 0,
    province: '',
    
    // Données projet
    montantTotal: 0,
    emploisStables: 0,
    
    // Mesures sélectionnées
    mesuresSelectionnees: [],
    
    // Détails par mesure
    logistique: { besoinTransport: false, volumesAnnuels: 0, coutLogistiqueActuel: 0 },
    energie: { consommationkWh: 0, typeEnergie: '', installationPrevue: '' },
    rd: { budgetRD: 0, partenariat: false, typeInnovation: '' },
    financement: { besoinFinancement: 0, typeFinancement: '', garantiesDisponibles: false },
    foncier: { surfaceNecessaire: 0, typeFoncier: '', budgetFoncier: 0 },
    formation: { nombrePersonnes: 0, typeFormation: '', budgetFormation: 0 },
    
    // Investissements
    investissementEquipement: 0,
    investissementFormation: 0,
    investissementInnovation: 0,
    investissementLogistique: 0,
    investissementEnergie: 0,
    investissementFoncier: 0,
    investissementDigitalisation: 0,
  });
  const [result, setResult] = useState<SimulationResultAxe2 | null>(null);

  const steps = [
    'Conditions d\'utilisation',
    'Profil entreprise',
    'Sélection mesures',
    'Détails des mesures',
    'Données financières',
    'Vérification cohérence',
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
      case 1: return projectData.typeEntreprise !== '' && projectData.secteurActivite !== '';
      case 2: return projectData.mesuresSelectionnees.length > 0;
      case 3: return true; // Détails optionnels
      case 4: return projectData.montantTotal > 0;
      case 5: return true; // Vérification
      default: return true;
    }
  };

  const calculateAidesAxe2 = () => {
    // Calcul des aides pour chaque mesure sélectionnée
    const mesuresApprouvees = [];
    let montantTotalAides = 0;
    const documentRequis = ['Business plan', 'Justificatifs secteur d\'activité'];
    const indicateursKPI = [];
    
    for (const mesureId of projectData.mesuresSelectionnees) {
      const mesure = MESURES_AXE2.find(m => m.id === mesureId);
      if (!mesure) continue;
      
      let montantAide = 0;
      let conditions: string[] = [];
      
      switch (mesureId) {
        case 'logistique':
          if (projectData.logistique.coutLogistiqueActuel > 100000) {
            montantAide = Math.min(projectData.investissementLogistique * 0.3, 2000000);
            conditions = ['Audit chaîne logistique', 'Contrat transporteur'];
            documentRequis.push('Audit logistique', 'Devis travaux');
            indicateursKPI.push({
              indicateur: 'Réduction lead time',
              cible: '20%',
              delai: '12 mois'
            });
          }
          break;
          
        case 'energie':
          if (projectData.energie.consommationkWh > 50000) {
            montantAide = Math.min(projectData.investissementEnergie * 0.25, 5000000);
            conditions = ['Étude de faisabilité', 'Raccordement réseau'];
            documentRequis.push('Étude PV/éolien', 'Permis environnemental');
            indicateursKPI.push({
              indicateur: 'kWh renouvelables produits',
              cible: projectData.energie.consommationkWh + ' kWh/an',
              delai: '18 mois'
            });
          }
          break;
          
        case 'rd':
          if (projectData.rd.budgetRD > 200000) {
            montantAide = Math.min(projectData.investissementInnovation * 0.4, 3000000);
            conditions = ['Partenariat université', 'Projet R&D éligible'];
            documentRequis.push('Cahier charges R&D', 'Convention partenariat');
            indicateursKPI.push({
              indicateur: 'Prototypes développés',
              cible: '2',
              delai: '24 mois'
            });
          }
          break;
          
        case 'financement':
          if (projectData.financement.besoinFinancement > 1000000) {
            montantAide = Math.min(projectData.financement.besoinFinancement * 0.15, 10000000);
            conditions = ['Garantie bancaire', 'Business plan validé'];
            documentRequis.push('Projections financières', 'États financiers');
            indicateursKPI.push({
              indicateur: 'Délai levée fonds',
              cible: '6 mois',
              delai: '6 mois'
            });
          }
          break;
          
        case 'foncier':
          if (projectData.foncier.surfaceNecessaire > 1000) {
            montantAide = Math.min(projectData.investissementFoncier * 0.2, 8000000);
            conditions = ['Terrain disponible', 'Projet éligible'];
            documentRequis.push('Plan cadastral', 'Acte foncier');
            indicateursKPI.push({
              indicateur: 'Surface allouée',
              cible: projectData.foncier.surfaceNecessaire + ' m²',
              delai: '9 mois'
            });
          }
          break;
          
        case 'formation':
          if (projectData.formation.nombrePersonnes > 5) {
            montantAide = Math.min(projectData.investissementFormation * 0.5, 1000000);
            conditions = ['Programme agréé', 'Co-financement'];
            documentRequis.push('Programme formation', 'Convention centre-entreprise');
            indicateursKPI.push({
              indicateur: 'Taux insertion',
              cible: '80%',
              delai: '6 mois'
            });
          }
          break;
      }
      
      if (montantAide > 0) {
        mesuresApprouvees.push({
          mesure: mesure.nom,
          typeAide: mesure.aides[0],
          montantAide,
          conditions
        });
        montantTotalAides += montantAide;
      }
    }
    
    const simulationResult: SimulationResultAxe2 = {
      eligibilite: mesuresApprouvees.length > 0,
      raisonIneligibilite: mesuresApprouvees.length === 0 ? 'Aucune mesure éligible selon les critères' : undefined,
      mesuresApprouvees,
      montantTotalAides,
      tempsTraitementEstime: Math.max(3, projectData.mesuresSelectionnees.length * 2), // mois
      documentRequis,
      indicateursKPI
    };
    
    setResult(simulationResult);
    
    // Envoyer au backend
    saveSimulation(simulationResult);
  };

  const saveSimulation = async (simulationResult: SimulationResultAxe2) => {
    try {
      const response = await fetch('/api/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'axe2',
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
      case 0: return renderTermsAndConditions();
      case 1: return renderProfilStep();
      case 2: return renderMesuresStep();
      case 3: return renderDetailsStep();
      case 4: return renderFinancesStep();
      case 5: return renderVerificationStep();
      case 6: return renderResultsStep();
      default: return null;
    }
  };

  const renderTermsAndConditions = () => (
    <div className="space-y-6">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-4">
            <h4 className="font-semibold">Conditions d'utilisation - Axe 2</h4>
            <div className="text-sm space-y-2">
              <p>• Ce simulateur concerne les mesures d'amélioration du climat des affaires</p>
              <p>• 7 mesures disponibles : logistique, énergie, R&D, financement, digitalisation, foncier, formation</p>
              <p>• Les résultats sont basés sur les critères de l'Axe 2 de la Charte d'investissement</p>
              <p>• Traitement par CRI (Centre Régional d'Investissement) ou CRUI selon montant</p>
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

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-4">
            <h4 className="font-semibold text-orange-600">Clause de non-responsabilité</h4>
            <div className="text-sm space-y-2">
              <p><strong>IMPORTANT :</strong> Cette simulation n'a aucune valeur contractuelle.</p>
              <p>• Les aides dépendent de l'instruction complète par les services compétents</p>
              <p>• Les délais peuvent varier selon la complexité du dossier</p>
              <p>• Chaque mesure fait l'objet d'une validation spécifique</p>
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

  const renderProfilStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Profil de votre entreprise</h3>
        <p className="text-gray-600">Déterminez votre éligibilité aux mesures de l'Axe 2</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="effectif">Effectif total</Label>
          <Input
            id="effectif"
            type="number"
            value={projectData.effectifTotal || ''}
            onChange={(e) => setProjectData({...projectData, effectifTotal: Number(e.target.value)})}
            placeholder="Nombre d'employés"
          />
        </div>
        
        <div>
          <Label htmlFor="ca">Chiffre d'affaires annuel (MAD)</Label>
          <Input
            id="ca"
            type="number"
            value={projectData.chiffreAffairesAnnuel || ''}
            onChange={(e) => setProjectData({...projectData, chiffreAffairesAnnuel: Number(e.target.value)})}
            placeholder="CA annuel"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="secteur">Secteur d'activité</Label>
        <Select value={projectData.secteurActivite} onValueChange={(value) => setProjectData({...projectData, secteurActivite: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez votre activité" />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITES_ELIGIBLES.map((activite) => (
              <SelectItem key={activite} value={activite}>{activite}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Auto-détection type entreprise */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Type d'entreprise détecté :</strong> {
            projectData.effectifTotal <= 10 && projectData.chiffreAffairesAnnuel <= 3000000 ? 'TPE (Très Petite Entreprise)' :
            projectData.effectifTotal <= 200 && projectData.chiffreAffairesAnnuel <= 175000000 ? 'PME (Petite et Moyenne Entreprise)' :
            projectData.effectifTotal > 200 || projectData.chiffreAffairesAnnuel > 175000000 ? 'Grande Entreprise' :
            'Non déterminé'
          }
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderMesuresStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Sélectionnez les mesures d'appui</h3>
        <p className="text-gray-600">Choisissez les mesures qui correspondent à vos besoins</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {MESURES_AXE2.map((mesure) => (
          <Card 
            key={mesure.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              projectData.mesuresSelectionnees.includes(mesure.id) 
                ? 'ring-2 ring-industria-olive-light bg-industria-olive-light/5' 
                : ''
            }`}
            onClick={() => {
              const newMesures = projectData.mesuresSelectionnees.includes(mesure.id)
                ? projectData.mesuresSelectionnees.filter(m => m !== mesure.id)
                : [...projectData.mesuresSelectionnees, mesure.id];
              setProjectData({...projectData, mesuresSelectionnees: newMesures});
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-2">{mesure.nom}</h4>
                  <p className="text-sm text-gray-600 mb-3">{mesure.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {mesure.aides.map((aide, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {aide}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="ml-4">
                  {projectData.mesuresSelectionnees.includes(mesure.id) && (
                    <div className="w-6 h-6 rounded-full bg-industria-olive-light text-white flex items-center justify-center text-sm">
                      ✓
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Alert className="bg-green-50 border-green-200">
        <AlertCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>{projectData.mesuresSelectionnees.length}</strong> mesure(s) sélectionnée(s). 
          Vous pouvez cumuler plusieurs mesures selon vos besoins.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Détails des mesures sélectionnées</h3>
        <p className="text-gray-600">Précisez les informations pour chaque mesure</p>
      </div>

      {projectData.mesuresSelectionnees.map((mesureId) => {
        const mesure = MESURES_AXE2.find(m => m.id === mesureId);
        if (!mesure) return null;

        return (
          <Card key={mesureId} className="border-2 border-industria-olive-light/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Badge variant="secondary">{mesure.nom}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contenu spécifique par mesure - simplifié pour l'exemple */}
              {mesureId === 'logistique' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Volumes annuels (tonnes)</Label>
                    <Input
                      type="number"
                      value={projectData.logistique.volumesAnnuels || ''}
                      onChange={(e) => setProjectData({
                        ...projectData,
                        logistique: { ...projectData.logistique, volumesAnnuels: Number(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Coût logistique actuel (MAD/an)</Label>
                    <Input
                      type="number"
                      value={projectData.logistique.coutLogistiqueActuel || ''}
                      onChange={(e) => setProjectData({
                        ...projectData,
                        logistique: { ...projectData.logistique, coutLogistiqueActuel: Number(e.target.value) }
                      })}
                    />
                  </div>
                </div>
              )}
              
              {mesureId === 'energie' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Consommation annuelle (kWh)</Label>
                    <Input
                      type="number"
                      value={projectData.energie.consommationkWh || ''}
                      onChange={(e) => setProjectData({
                        ...projectData,
                        energie: { ...projectData.energie, consommationkWh: Number(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Type installation prévue</Label>
                    <Select
                      value={projectData.energie.installationPrevue}
                      onValueChange={(value) => setProjectData({
                        ...projectData,
                        energie: { ...projectData.energie, installationPrevue: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type d'installation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solaire">Solaire photovoltaïque</SelectItem>
                        <SelectItem value="eolien">Éolien</SelectItem>
                        <SelectItem value="biomasse">Biomasse</SelectItem>
                        <SelectItem value="mixte">Installation mixte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              {/* Autres mesures... simplifiées */}
              {mesureId !== 'logistique' && mesureId !== 'energie' && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Les détails spécifiques pour cette mesure seront collectés lors de l'instruction du dossier.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderFinancesStep = () => {
    const totalInvestissements = projectData.investissementEquipement + 
      projectData.investissementFormation + projectData.investissementInnovation + 
      projectData.investissementLogistique + projectData.investissementEnergie + 
      projectData.investissementFoncier + projectData.investissementDigitalisation;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Données financières du projet</h3>
          <p className="text-gray-600">Détaillez les investissements prévus</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Montant total projet (MAD)</Label>
            <Input
              type="number"
              value={projectData.montantTotal || ''}
              onChange={(e) => setProjectData({...projectData, montantTotal: Number(e.target.value)})}
              placeholder="Montant total"
            />
          </div>
          <div>
            <Label>Emplois à créer</Label>
            <Input
              type="number"
              value={projectData.emploisStables || ''}
              onChange={(e) => setProjectData({...projectData, emploisStables: Number(e.target.value)})}
              placeholder="Nombre d'emplois"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Investissement équipements</Label>
            <Input
              type="number"
              value={projectData.investissementEquipement || ''}
              onChange={(e) => setProjectData({...projectData, investissementEquipement: Number(e.target.value)})}
            />
          </div>
          <div>
            <Label>Investissement formation</Label>
            <Input
              type="number"
              value={projectData.investissementFormation || ''}
              onChange={(e) => setProjectData({...projectData, investissementFormation: Number(e.target.value)})}
            />
          </div>
          <div>
            <Label>Investissement R&D</Label>
            <Input
              type="number"
              value={projectData.investissementInnovation || ''}
              onChange={(e) => setProjectData({...projectData, investissementInnovation: Number(e.target.value)})}
            />
          </div>
          <div>
            <Label>Investissement énergie</Label>
            <Input
              type="number"
              value={projectData.investissementEnergie || ''}
              onChange={(e) => setProjectData({...projectData, investissementEnergie: Number(e.target.value)})}
            />
          </div>
        </div>

        {/* Vérification cohérence */}
        {totalInvestissements > 0 && (
          <Card className={`border-2 ${
            Math.abs(totalInvestissements - projectData.montantTotal) <= projectData.montantTotal * 0.05
              ? 'border-green-200 bg-green-50' 
              : 'border-orange-200 bg-orange-50'
          }`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Total ventilation</p>
                  <p className="font-medium">{totalInvestissements.toLocaleString('fr-FR')} MAD</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Montant déclaré</p>
                  <p className="font-medium">{projectData.montantTotal.toLocaleString('fr-FR')} MAD</p>
                </div>
                <div>
                  <Badge variant={Math.abs(totalInvestissements - projectData.montantTotal) <= projectData.montantTotal * 0.05 ? "default" : "destructive"}>
                    {Math.abs(totalInvestissements - projectData.montantTotal) <= projectData.montantTotal * 0.05 ? '✓ Cohérent' : '⚠ Écart'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderVerificationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Vérification des données</h3>
        <p className="text-gray-600">Vérifiez vos informations avant calcul</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Récapitulatif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Secteur</p>
              <p className="font-medium">{projectData.secteurActivite}</p>
            </div>
            <div>
              <p className="text-gray-600">Montant projet</p>
              <p className="font-medium">{projectData.montantTotal.toLocaleString('fr-FR')} MAD</p>
            </div>
            <div>
              <p className="text-gray-600">Emplois</p>
              <p className="font-medium">{projectData.emploisStables}</p>
            </div>
            <div>
              <p className="text-gray-600">Mesures</p>
              <p className="font-medium">{projectData.mesuresSelectionnees.length} sélectionnées</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button 
          onClick={calculateAidesAxe2}
          className="bg-gradient-to-r from-industria-olive-light to-industria-brown-gold text-white px-8 py-3"
        >
          <Calculator className="w-5 h-5 mr-2" />
          Calculer les aides
        </Button>
      </div>
    </div>
  );

  const renderResultsStep = () => {
    if (!result) {
      return <div className="text-center py-8">Calcul en cours...</div>;
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Résultats de votre simulation</h3>
        </div>

        {result.eligibilite ? (
          <>
            <div className="bg-gradient-to-r from-green-50 to-industria-olive-light/10 p-6 rounded-lg border border-green-200">
              <div className="text-center">
                <p className="text-sm text-green-600 font-medium">✅ Projet éligible</p>
                <p className="text-3xl font-bold text-industria-olive-light mt-2">
                  {result.montantTotalAides.toLocaleString('fr-FR')} MAD
                </p>
                <p className="text-sm text-gray-600">Total des aides estimées</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {result.mesuresApprouvees.map((mesure, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{mesure.mesure}</h4>
                        <p className="text-sm text-gray-600">{mesure.typeAide}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-industria-olive-light">
                          {mesure.montantAide.toLocaleString('fr-FR')} MAD
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Prochaines étapes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Temps de traitement estimé :</strong> {result.tempsTraitementEstime} mois</p>
                  <p><strong>Documents à préparer :</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    {result.documentRequis.map((doc, index) => (
                      <li key={index}>{doc}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="bg-red-50 p-6 rounded-lg border border-red-200">
            <div className="text-center">
              <p className="text-sm text-red-600 font-medium">❌ Projet non éligible</p>
              <p className="text-sm text-red-700 mt-2">{result.raisonIneligibilite}</p>
            </div>
          </div>
        )}
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
                  <Building2 className="w-8 h-8 text-industria-olive-light" />
                  Simulateur Axe 2 - Climat des Affaires
                </CardTitle>
                <p className="text-lg text-gray-600">
                  Mesures d'amélioration du climat des affaires
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {renderTermsAndConditions()}
                
                <div className="text-center">
                  <Button 
                    onClick={handleStartSimulation}
                    disabled={!acceptedTerms || !acceptedDisclaimer}
                    className="bg-gradient-to-r from-industria-olive-light to-industria-brown-gold hover:from-industria-brown-gold hover:to-industria-olive-light text-white px-8 py-3"
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
              <h2 className="text-2xl font-bold text-gray-900">Simulateur Axe 2 - Climat des Affaires</h2>
              <Badge variant="outline" className="px-3 py-1">
                Étape {currentStep + 1} sur {steps.length}
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-industria-olive-light to-industria-brown-gold h-2 rounded-full transition-all duration-500"
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
                  className="bg-gradient-to-r from-industria-olive-light to-industria-brown-gold text-white px-6"
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