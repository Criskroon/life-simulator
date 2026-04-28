import type { Country, CountryCode } from '../types/country';

/**
 * The world. Six countries with rich gameplay data + economic indices.
 *
 * Each country combines:
 * - Economic indicators (GDP, salary, cost-of-living) for adjustSalary/adjustPrice
 * - Education system (stages with prerequisites and requirements)
 * - Career market (specific jobs with salary ranges)
 * - Cities (with cost multipliers and character)
 * - Legal, healthcare, housing, culture, names
 * - Optional flavor (cuisine, holidays, sports, climate)
 *
 * Indexing convention: GB is the implicit baseline. costOfLivingIndex and
 * housingPriceIndex are normalised so 1.0 = GB; averageSalary is anchored
 * at GB so the existing baseline numbers in careers.ts and event payloads
 * keep their original meaning.
 *
 * Data sources cited inline per country. Data year: 2024-2026.
 *
 * Adding a country: append a record below, ensure ISO-2 code is added to
 * CountryCode union in types/country.ts, fill from authoritative sources.
 */
export const COUNTRIES: Country[] = [
  // ==========================================================================
  // NETHERLANDS — fully developed reference country (CBS 2024-2026)
  // ==========================================================================
  {
    code: 'NL',
    name: 'Netherlands',
    nameLocal: 'Nederland',
    flag: '🇳🇱',
    continent: 'Europe',
    region: 'Western Europe',
    culturalCluster: 'North-European',

    language: 'Dutch',
    languages: ['nl', 'en', 'fy'],
    currency: {
      code: 'EUR',
      symbol: '€',
      priceMultiplier: 1.0,
      salaryMultiplier: 1.0,
    },

    demographics: {
      lifeExpectancy: { male: 80, female: 83 },
      partnershipAgeAverage: { male: 29, female: 28 },
      marriageAgeAverage: { male: 38, female: 35 },
      firstChildAgeAverage: { male: 33, female: 30 },
      averageChildrenPerFamily: 1.5,
      retirementAge: 67,
      adultAge: 18,
      educationIndex: 0.926,
      crimeIndex: 27.0,
      happinessIndex: 6.92,
      giniCoefficient: 0.262,
    },

    economics: {
      gdpPerCapita: 65915,
      averageSalary: 47500,
      medianSalary: 40000,
      inflationRate: 3.8,
      unemploymentRate: 3.6,
      costOfLivingIndex: 0.97,
      housingPriceIndex: 1.10,
    },

    education: {
      schoolStartAge: 4,
      compulsoryUntilAge: 18,
      universityDuration: { bachelor: 3, master: 1 },
      tuitionAnnual: { public: 2694, private: 15000 },
      gpaScale: 'NL_10',
      selectionAt: 12,
      stages: [
        {
          id: 'basisschool',
          name: 'Primary School',
          nameLocal: 'Basisschool',
          level: 'primary',
          ageStart: 4,
          ageEnd: 12,
          duration: 8,
          isCompulsory: true,
          isSelectable: false,
          prerequisites: [],
          nextStages: ['vmbo', 'havo', 'vwo'],
          cost: { tuitionAnnual: 0, isPublic: true, scholarshipsAvailable: false },
          description:
            'Eight years of primary education. The foundation for everything that follows.',
          iscedLevel: 1,
          iscedSubTrack: 'general',
          hasSpecialization: false,
        },
        {
          id: 'vmbo',
          name: 'Pre-Vocational Secondary',
          nameLocal: 'VMBO',
          abbreviation: 'VMBO',
          level: 'lower_secondary',
          ageStart: 12,
          ageEnd: 16,
          duration: 4,
          isCompulsory: true,
          isSelectable: true,
          prerequisites: ['basisschool'],
          nextStages: ['mbo', 'havo'],
          requirements: { minSmarts: 30 },
          cost: { tuitionAnnual: 0, isPublic: true, scholarshipsAvailable: false },
          description:
            'Four-year vocational track. Practical skills and direct path to MBO.',
          iscedLevel: 2,
          iscedSubTrack: 'vocational',
          hasSpecialization: true,
          availableSpecializations: ['economics', 'engineering', 'health', 'agriculture'],
        },
        {
          id: 'havo',
          name: 'Senior General Secondary',
          nameLocal: 'HAVO',
          abbreviation: 'HAVO',
          level: 'upper_secondary',
          ageStart: 12,
          ageEnd: 17,
          duration: 5,
          isCompulsory: true,
          isSelectable: true,
          prerequisites: ['basisschool'],
          nextStages: ['hbo_bachelor', 'vwo'],
          requirements: { minSmarts: 50 },
          cost: { tuitionAnnual: 0, isPublic: true, scholarshipsAvailable: false },
          description:
            'Five-year general secondary education. Standard route to HBO.',
          iscedLevel: 3,
          iscedSubTrack: 'general',
          hasSpecialization: true,
          availableSpecializations: ['humanities', 'economics', 'health', 'science'],
        },
        {
          id: 'vwo',
          name: 'Pre-University Secondary',
          nameLocal: 'VWO',
          abbreviation: 'VWO',
          level: 'upper_secondary',
          ageStart: 12,
          ageEnd: 18,
          duration: 6,
          isCompulsory: true,
          isSelectable: true,
          prerequisites: ['basisschool'],
          nextStages: ['wo_bachelor', 'hbo_bachelor'],
          requirements: { minSmarts: 70 },
          cost: { tuitionAnnual: 0, isPublic: true, scholarshipsAvailable: false },
          description: 'Six-year pre-university education. The academic track.',
          iscedLevel: 3,
          iscedSubTrack: 'academic',
          hasSpecialization: true,
          availableSpecializations: ['humanities', 'economics', 'health', 'science'],
        },
        {
          id: 'mbo',
          name: 'Vocational Education',
          nameLocal: 'MBO',
          abbreviation: 'MBO',
          level: 'vocational',
          ageStart: 16,
          ageEnd: 20,
          duration: 4,
          isCompulsory: false,
          isSelectable: true,
          prerequisites: ['vmbo'],
          nextStages: ['hbo_bachelor'],
          cost: { tuitionAnnual: 1379, isPublic: true, scholarshipsAvailable: true },
          description:
            'Vocational education at four levels. Trades, services, and applied skills.',
          iscedLevel: 4,
          iscedSubTrack: 'vocational',
          hasSpecialization: true,
          availableSpecializations: [
            'engineering',
            'health',
            'business',
            'agriculture',
            'creative',
            'social_sciences',
            'general',
          ],
        },
        {
          id: 'hbo_bachelor',
          name: 'Applied Sciences Bachelor',
          nameLocal: 'HBO Bachelor',
          abbreviation: 'HBO',
          level: 'tertiary',
          ageStart: 17,
          ageEnd: 21,
          duration: 4,
          isCompulsory: false,
          isSelectable: true,
          prerequisites: ['havo', 'mbo', 'vwo'],
          nextStages: ['wo_master'],
          requirements: { minSmarts: 55 },
          cost: { tuitionAnnual: 2694, isPublic: true, scholarshipsAvailable: true },
          description:
            'Four-year applied sciences degree. Career-focused higher education.',
          iscedLevel: 6,
          iscedSubTrack: 'vocational',
          hasSpecialization: true,
          availableSpecializations: [
            'computer_science',
            'engineering',
            'business',
            'health',
            'education',
            'creative',
            'social_sciences',
            'economics',
            'law',
          ],
        },
        {
          id: 'wo_bachelor',
          name: 'Research University Bachelor',
          nameLocal: 'WO Bachelor',
          abbreviation: 'WO',
          level: 'tertiary',
          ageStart: 18,
          ageEnd: 21,
          duration: 3,
          isCompulsory: false,
          isSelectable: true,
          prerequisites: ['vwo'],
          nextStages: ['wo_master'],
          requirements: { minSmarts: 75 },
          cost: { tuitionAnnual: 2694, isPublic: true, scholarshipsAvailable: true },
          description: 'Three-year academic bachelor at a research university.',
          iscedLevel: 6,
          iscedSubTrack: 'academic',
          hasSpecialization: true,
          availableSpecializations: [
            'computer_science',
            'engineering',
            'science',
            'medicine',
            'humanities',
            'social_sciences',
            'economics',
            'law',
            'business',
          ],
        },
        {
          id: 'wo_master',
          name: 'Research University Master',
          nameLocal: 'WO Master',
          level: 'graduate',
          ageStart: 21,
          ageEnd: 23,
          duration: 1,
          isCompulsory: false,
          isSelectable: true,
          prerequisites: ['wo_bachelor'],
          nextStages: ['phd'],
          requirements: { minSmarts: 80 },
          cost: { tuitionAnnual: 2694, isPublic: true, scholarshipsAvailable: true },
          description: 'One to two years of specialization after WO bachelor.',
          iscedLevel: 7,
          iscedSubTrack: 'academic',
          hasSpecialization: true,
          availableSpecializations: [
            'computer_science',
            'engineering',
            'science',
            'medicine',
            'humanities',
            'social_sciences',
            'economics',
            'law',
            'business',
          ],
        },
        {
          id: 'phd',
          name: 'Doctorate',
          nameLocal: 'PhD',
          level: 'graduate',
          ageStart: 23,
          ageEnd: 27,
          duration: 4,
          isCompulsory: false,
          isSelectable: true,
          prerequisites: ['wo_master'],
          nextStages: [],
          requirements: { minSmarts: 90 },
          cost: { tuitionAnnual: 0, isPublic: true, scholarshipsAvailable: false },
          description:
            'Four-year doctoral research position. Paid employment, not tuition.',
          iscedLevel: 8,
          iscedSubTrack: 'academic',
          hasSpecialization: true,
          availableSpecializations: [
            'computer_science',
            'engineering',
            'science',
            'medicine',
            'humanities',
            'social_sciences',
            'economics',
            'law',
          ],
        },
      ],
    },

    career: {
      minimumWageMonthly: 2304,
      averageWorkWeek: 36,
      paidVacationDays: 25,
      careerCulture: 'merit',
      prominentIndustries: [
        'Tech',
        'Healthcare',
        'Logistics',
        'Finance',
        'Government',
        'Agriculture',
        'Retail',
        'Construction',
      ],
      jobs: [
        // ===== ENTRY LEVEL =====
        {
          id: 'cashier_nl',
          title: 'Cashier',
          titleLocal: 'Kassamedewerker',
          industry: 'Retail',
          category: 'entry',
          ageRange: { min: 16, max: 65 },
          salaryRange: { min: 1900, max: 2400, median: 2150 },
          workHours: 24,
          educationRequired: ['vmbo', 'havo', 'vwo'],
          description: 'Stand up all day, scan things, smile at strangers.',
          prevalence: 'common',
        },
        {
          id: 'warehouse_worker_nl',
          title: 'Warehouse Worker',
          titleLocal: 'Magazijnmedewerker',
          industry: 'Logistics',
          category: 'entry',
          ageRange: { min: 18, max: 55 },
          salaryRange: { min: 2300, max: 2900, median: 2600 },
          workHours: 40,
          educationRequired: ['vmbo', 'havo', 'vwo'],
          description: 'Pack boxes. Hit targets. Coffee at ten.',
          prevalence: 'common',
        },
        {
          id: 'waiter_nl',
          title: 'Waiter',
          titleLocal: 'Ober',
          industry: 'Hospitality',
          category: 'entry',
          ageRange: { min: 16, max: 50 },
          salaryRange: { min: 2000, max: 2700, median: 2300 },
          workHours: 30,
          educationRequired: ['vmbo', 'havo', 'vwo'],
          description: 'Late nights, regulars who tip well, regulars who do not.',
          prevalence: 'common',
        },

        // ===== VOCATIONAL (MBO) =====
        {
          id: 'plumber_nl',
          title: 'Plumber',
          titleLocal: 'Loodgieter',
          industry: 'Construction',
          category: 'mid',
          ageRange: { min: 20, max: 60 },
          salaryRange: { min: 2900, max: 4200, median: 3500 },
          workHours: 40,
          educationRequired: ['mbo'],
          description: 'Pipes, leaks, hot water that works. Always work to do.',
          prevalence: 'common',
        },
        {
          id: 'construction_worker_nl',
          title: 'Construction Worker',
          titleLocal: 'Bouwvakker',
          industry: 'Construction',
          category: 'entry',
          ageRange: { min: 18, max: 55 },
          salaryRange: { min: 2400, max: 3300, median: 2845 },
          workHours: 40,
          educationRequired: ['mbo', 'vmbo'],
          description: 'Build the city others will live in.',
          prevalence: 'common',
        },
        {
          id: 'mbo_nurse_nl',
          title: 'Nurse (MBO)',
          titleLocal: 'Verpleegkundige (MBO)',
          industry: 'Healthcare',
          category: 'mid',
          ageRange: { min: 20, max: 65 },
          salaryRange: { min: 2750, max: 3600, median: 3155 },
          workHours: 32,
          educationRequired: ['mbo'],
          description: 'Long shifts, hard moments, work that matters.',
          prevalence: 'common',
        },
        {
          id: 'electrician_nl',
          title: 'Electrician',
          titleLocal: 'Elektricien',
          industry: 'Construction',
          category: 'mid',
          ageRange: { min: 20, max: 60 },
          salaryRange: { min: 3000, max: 4400, median: 3700 },
          workHours: 40,
          educationRequired: ['mbo'],
          description: 'Power that works. Wiring no one else can read.',
          prevalence: 'common',
        },
        {
          id: 'mechanic_nl',
          title: 'Auto Mechanic',
          titleLocal: 'Automonteur',
          industry: 'Automotive',
          category: 'mid',
          ageRange: { min: 18, max: 60 },
          salaryRange: { min: 2600, max: 3700, median: 3100 },
          workHours: 40,
          educationRequired: ['mbo'],
          description: 'Fix what breaks. Hands black by noon.',
          prevalence: 'common',
        },

        // ===== HBO LEVEL =====
        {
          id: 'teacher_primary_nl',
          title: 'Primary School Teacher',
          titleLocal: 'Basisschoolleraar',
          industry: 'Education',
          category: 'mid',
          ageRange: { min: 22, max: 65 },
          salaryRange: { min: 2900, max: 4400, median: 3500 },
          workHours: 32,
          educationRequired: ['hbo_bachelor'],
          prerequisites: { minSmarts: 50 },
          description: 'Twenty-five small futures, every September.',
          prevalence: 'common',
        },
        {
          id: 'hbo_nurse_nl',
          title: 'Nurse (HBO)',
          titleLocal: 'Verpleegkundige (HBO)',
          industry: 'Healthcare',
          category: 'mid',
          ageRange: { min: 22, max: 65 },
          salaryRange: { min: 3000, max: 4300, median: 3700 },
          workHours: 32,
          educationRequired: ['hbo_bachelor'],
          prerequisites: { minSmarts: 60 },
          description:
            'More responsibility, same long shifts, slightly higher pay.',
          prevalence: 'common',
        },
        {
          id: 'accountant_nl',
          title: 'Accountant',
          titleLocal: 'Accountant',
          industry: 'Finance',
          category: 'mid',
          ageRange: { min: 22, max: 65 },
          salaryRange: { min: 3200, max: 5500, median: 4100 },
          workHours: 40,
          educationRequired: ['hbo_bachelor', 'wo_bachelor'],
          prerequisites: { minSmarts: 65 },
          description: 'Numbers that have to add up. They always add up.',
          prevalence: 'common',
        },
        {
          id: 'marketing_specialist_nl',
          title: 'Marketing Specialist',
          titleLocal: 'Marketing Specialist',
          industry: 'Marketing',
          category: 'mid',
          ageRange: { min: 22, max: 60 },
          salaryRange: { min: 2900, max: 4500, median: 3600 },
          workHours: 40,
          educationRequired: ['hbo_bachelor', 'wo_bachelor'],
          prerequisites: { minSmarts: 60 },
          description: 'Campaigns, metrics, meetings about meetings.',
          prevalence: 'common',
        },
        {
          id: 'civil_servant_nl',
          title: 'Civil Servant',
          titleLocal: 'Ambtenaar',
          industry: 'Government',
          category: 'mid',
          ageRange: { min: 22, max: 67 },
          salaryRange: { min: 3000, max: 5200, median: 3900 },
          workHours: 36,
          educationRequired: ['hbo_bachelor', 'wo_bachelor'],
          prerequisites: { minSmarts: 65 },
          description: 'The slow gears of public service. Pension secured.',
          prevalence: 'common',
        },

        // ===== WO LEVEL =====
        {
          id: 'junior_developer_nl',
          title: 'Junior Software Developer',
          titleLocal: 'Junior Software Developer',
          industry: 'Tech',
          category: 'entry',
          ageRange: { min: 22, max: 55 },
          salaryRange: { min: 2800, max: 3800, median: 3300 },
          workHours: 40,
          educationRequired: ['hbo_bachelor', 'wo_bachelor'],
          prerequisites: { minSmarts: 65 },
          description: 'Write code that someone else will rewrite next year.',
          prevalence: 'common',
        },
        {
          id: 'medior_developer_nl',
          title: 'Software Developer',
          titleLocal: 'Software Developer',
          industry: 'Tech',
          category: 'mid',
          ageRange: { min: 25, max: 60 },
          salaryRange: { min: 3500, max: 5500, median: 4500 },
          workHours: 40,
          educationRequired: ['hbo_bachelor', 'wo_bachelor'],
          prerequisites: { minSmarts: 70 },
          description:
            'Three to seven years in. You stop calling yourself junior.',
          prevalence: 'common',
        },
        {
          id: 'doctor_gp_nl',
          title: 'General Practitioner',
          titleLocal: 'Huisarts',
          industry: 'Healthcare',
          category: 'specialist',
          ageRange: { min: 28, max: 67 },
          salaryRange: { min: 7000, max: 12000, median: 9000 },
          workHours: 40,
          educationRequired: ['wo_master'],
          prerequisites: { minSmarts: 85 },
          description:
            'Ten years of training. A waiting room that never empties.',
          prevalence: 'uncommon',
        },
        {
          id: 'lawyer_nl',
          title: 'Lawyer',
          titleLocal: 'Advocaat',
          industry: 'Law',
          category: 'specialist',
          ageRange: { min: 25, max: 70 },
          salaryRange: { min: 4500, max: 9000, median: 6500 },
          workHours: 50,
          educationRequired: ['wo_master'],
          prerequisites: { minSmarts: 80 },
          description: 'Read contracts. Write contracts. Argue about contracts.',
          prevalence: 'uncommon',
        },

        // ===== EXECUTIVE =====
        {
          id: 'manager_nl',
          title: 'Department Manager',
          titleLocal: 'Manager',
          industry: 'Management',
          category: 'executive',
          ageRange: { min: 30, max: 65 },
          salaryRange: { min: 5500, max: 9500, median: 7000 },
          workHours: 45,
          educationRequired: ['hbo_bachelor', 'wo_bachelor', 'wo_master'],
          prerequisites: { minSmarts: 70, minAge: 30 },
          description: 'Lead twenty people who could lead themselves.',
          prevalence: 'uncommon',
        },
      ],
    },

    cities: [
      {
        id: 'amsterdam',
        name: 'Amsterdam',
        nameLocal: 'Amsterdam',
        region: 'Noord-Holland',
        isCapital: true,
        population: 875000,
        costMultiplier: 1.4,
        description:
          'Cosmopolitan capital. Cycling everywhere. Tourist crowds and tall narrow houses.',
        characterTags: [
          'cosmopolitan',
          'expensive',
          'cycling',
          'international',
          'cultural',
          'crowded',
        ],
      },
      {
        id: 'rotterdam',
        name: 'Rotterdam',
        nameLocal: 'Rotterdam',
        region: 'Zuid-Holland',
        isCapital: false,
        population: 638000,
        costMultiplier: 1.15,
        description:
          "Modern architecture rebuilt after the war. Europe's largest port. Direct, no nonsense.",
        characterTags: [
          'modern',
          'industrial',
          'multicultural',
          'direct',
          'port-city',
          'architectural',
        ],
      },
      {
        id: 'den_haag',
        name: 'The Hague',
        nameLocal: 'Den Haag',
        region: 'Zuid-Holland',
        isCapital: false,
        population: 545000,
        costMultiplier: 1.2,
        description:
          'Government seat and royal city. International courts and beach within reach.',
        characterTags: [
          'governmental',
          'diplomatic',
          'royal',
          'coastal',
          'international',
          'formal',
        ],
      },
      {
        id: 'utrecht',
        name: 'Utrecht',
        nameLocal: 'Utrecht',
        region: 'Utrecht',
        isCapital: false,
        population: 365000,
        costMultiplier: 1.05,
        description:
          'Central, medieval, full of students. Canals and bicycles and old churches.',
        characterTags: [
          'central',
          'student-city',
          'medieval',
          'historic',
          'canals',
          'compact',
        ],
      },
      {
        id: 'eindhoven',
        name: 'Eindhoven',
        nameLocal: 'Eindhoven',
        region: 'Noord-Brabant',
        isCapital: false,
        population: 240000,
        costMultiplier: 0.85,
        description:
          'Tech and design hub. Brainport region. Younger, cheaper, and growing fast.',
        characterTags: [
          'tech',
          'design',
          'modern',
          'affordable',
          'young',
          'industrial',
        ],
      },
    ],

    housing: {
      rentMedianMonthly: 1700,
      ownershipRate: 0.69,
      typicalMortgageYears: 30,
      propertyTypes: ['apartment', 'rowhouse', 'detached', 'studio'],
      medianPropertyPrice: 460000,
    },

    healthcare: {
      system: 'mixed',
      annualCostBaseline: 1800,
      qualityIndex: 88,
      insuranceMandatory: true,
    },

    legal: {
      drinkingAge: 18,
      smokingAge: 18,
      legalMarriageAge: 18,
      drivingAge: 18,
      votingAge: 18,
      softDrugsLegal: true,
      sameSexMarriage: true,
      deathPenalty: false,
      gamblingLegal: true,
      militaryService: 'voluntary',
      incomeTaxTopRate: 0.495,
    },

    culture: {
      nameOrder: 'first_last',
      automotiveBrands: [
        'Volkswagen',
        'Volvo',
        'BMW',
        'Audi',
        'Toyota',
        'Tesla',
        'Renault',
        'Peugeot',
        'Opel',
        'Ford',
      ],
      typicalLifePath:
        'School to higher education to first job. Living together before marriage. Children in early thirties.',
    },

    names: {
      firstNamesMale: [
        // Modern (2020-2025)
        'Noah', 'Liam', 'Luca', 'Lucas', 'Mees',
        'James', 'Adam', 'Sem', 'Levi', 'Bram',
        'Finn', 'Daan', 'Max', 'Sam', 'Milan',
        // Millennial (1990s-2000s)
        'Thijs', 'Tim', 'Tom', 'Bas', 'Niels',
        'Ruben', 'Stijn', 'Sven',
        // Gen X (1970s-1980s)
        'Mark', 'Marco', 'Erik', 'Patrick', 'Robert',
        'Dennis', 'Marcel', 'Richard', 'Edwin',
        // Boomer (1950s-1960s)
        'Jan', 'Piet', 'Henk', 'Cor', 'Wim',
        'Frans', 'Hans', 'Peter', 'Paul', 'Rob',
        // Classic (1930s-1940s)
        'Johannes', 'Hendrik', 'Cornelis', 'Willem',
        'Gerrit', 'Antonius', 'Theodorus', 'Adriaan',
      ],
      firstNamesFemale: [
        // Modern (2020-2025)
        'Noor', 'Emma', 'Olivia', 'Nora', 'Sophie',
        'Mila', 'Julia', 'Sara', 'Yara', 'Eva',
        'Tess', 'Lina', 'Saar', 'Fenna', 'Lotte',
        // Millennial (1990s-2000s)
        'Lisa', 'Anouk', 'Iris', 'Lieke', 'Maud',
        'Sanne', 'Bo', 'Femke', 'Roos',
        // Gen X (1970s-1980s)
        'Linda', 'Marieke', 'Sandra', 'Karin', 'Petra',
        'Monique', 'Esther', 'Astrid', 'Yvonne',
        // Boomer (1950s-1960s)
        'Wilma', 'Ans', 'Ria', 'Truus', 'Greet',
        'Ina', 'Tineke', 'Joke', 'Carla', 'Margriet',
        // Classic (1930s-1940s)
        'Johanna', 'Cornelia', 'Hendrika', 'Maria',
        'Catharina', 'Geertruida', 'Wilhelmina',
      ],
      lastNames: [
        'De Jong', 'Jansen', 'De Vries', 'Van den Berg', 'Bakker',
        'Van Dijk', 'Visser', 'Janssen', 'Smit', 'Meijer',
        'De Boer', 'Mulder', 'De Groot', 'Bos', 'Vos',
        'Peters', 'Hendriks', 'Van Leeuwen', 'Dekker', 'Brouwer',
        'Van der Meer', 'Van der Linden', 'Van der Velde',
        'Van Beek', 'Van Veen', 'Van Dam',
        'Hoekstra', 'Kuipers', 'De Wit', 'Van der Heijden',
        'Bosch', 'Koster', 'Kok', 'Verhoeven', 'Van der Berg',
      ],
    },

    cuisineHighlights: [
      'Stamppot',
      'Bitterballen',
      'Stroopwafels',
      'Hagelslag',
      'Frikandel',
      'Haring',
      'Erwtensoep',
      'Poffertjes',
    ],

    sportsCulture: {
      nationalSports: ['Football', 'Cycling', 'Speed skating'],
      popularSports: [
        'Football',
        'Cycling',
        'Field hockey',
        'Tennis',
        'Korfball',
      ],
    },

    holidays: [
      {
        name: "King's Day",
        nameLocal: 'Koningsdag',
        month: 4,
        day: 27,
        significance: 'national',
        description: 'Orange parties everywhere. Free markets in every street.',
      },
      {
        name: 'Liberation Day',
        nameLocal: 'Bevrijdingsdag',
        month: 5,
        day: 5,
        significance: 'national',
        description:
          'Festivals across the country. Free music if you know where to look.',
      },
      {
        name: 'Sinterklaas',
        nameLocal: 'Sinterklaas',
        month: 12,
        day: 5,
        significance: 'cultural',
        description: 'Family gatherings. Poems. Chocolate letters.',
      },
      {
        name: 'Christmas',
        nameLocal: 'Kerstmis',
        month: 12,
        day: 25,
        significance: 'religious',
        description: 'Two days off work. Family, food, and quiet streets.',
      },
    ],

    climate: {
      summerHigh: 23,
      winterLow: 1,
      description: 'Mild oceanic. Rain ten months a year. Wind always.',
    },
  },

  // ==========================================================================
  // UNITED STATES — economics from World Bank/BLS, gameplay stubs
  //   GDP per capita: World Bank 2023 ($82,769)
  //   Avg salary: BLS 2023 ($65,470 mean wage)
  //   Median salary: BLS 2023 ($48,060)
  //   Cost of living vs GB: Numbeo 2023 (~7% above)
  //   Housing: Numbeo 2023 (~5% below GB)
  // ==========================================================================
  {
    code: 'US',
    name: 'United States',
    nameLocal: 'United States',
    flag: '🇺🇸',
    continent: 'North America',
    region: 'Northern America',
    culturalCluster: 'Anglo-Saxon',

    language: 'English',
    languages: ['en'],
    currency: {
      code: 'USD',
      symbol: '$',
      priceMultiplier: 1.1,
      salaryMultiplier: 1.4,
    },

    demographics: {
      lifeExpectancy: { male: 75, female: 80 },
      partnershipAgeAverage: { male: 28, female: 27 },
      marriageAgeAverage: { male: 30, female: 28 },
      firstChildAgeAverage: { male: 31, female: 28 },
      averageChildrenPerFamily: 1.6,
      retirementAge: 65,
      adultAge: 18,
      educationIndex: 0.900,
      crimeIndex: 49.0,
      happinessIndex: 6.73,
      giniCoefficient: 0.398,
    },

    economics: {
      gdpPerCapita: 82769,
      averageSalary: 65470,
      medianSalary: 48060,
      inflationRate: 4.1,
      unemploymentRate: 3.7,
      costOfLivingIndex: 1.07,
      housingPriceIndex: 0.95,
    },

    education: {
      schoolStartAge: 5,
      compulsoryUntilAge: 16,
      universityDuration: { bachelor: 4, master: 2 },
      tuitionAnnual: { public: 10000, private: 40000 },
      gpaScale: 'US_4',
      stages: [],
    },

    career: {
      minimumWageMonthly: 1257,
      averageWorkWeek: 40,
      paidVacationDays: 10,
      careerCulture: 'merit',
      prominentIndustries: [],
      jobs: [],
    },

    cities: [],

    housing: {
      rentMedianMonthly: 1500,
      ownershipRate: 0.65,
      typicalMortgageYears: 30,
      propertyTypes: ['apartment', 'detached', 'townhouse', 'condo'],
      medianPropertyPrice: 420000,
    },

    healthcare: {
      system: 'private',
      annualCostBaseline: 5000,
      qualityIndex: 70,
      insuranceMandatory: false,
    },

    legal: {
      drinkingAge: 21,
      smokingAge: 21,
      legalMarriageAge: 18,
      drivingAge: 16,
      votingAge: 18,
      softDrugsLegal: false,
      sameSexMarriage: true,
      deathPenalty: true,
      gamblingLegal: true,
      militaryService: 'voluntary',
      incomeTaxTopRate: 0.37,
    },

    culture: {
      nameOrder: 'first_last',
      automotiveBrands: ['Ford', 'Chevrolet', 'Toyota', 'Honda', 'Tesla'],
      typicalLifePath:
        'School to college to career. Marriage in late twenties.',
    },

    names: {
      firstNamesMale: ['Liam', 'Noah', 'James', 'Oliver', 'Elijah'],
      firstNamesFemale: ['Olivia', 'Emma', 'Charlotte', 'Amelia', 'Sophia'],
      lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'],
    },
  },

  // ==========================================================================
  // UNITED KINGDOM — adjustment baseline (1.0 indices), economics preserved
  //   GDP per capita: World Bank 2023 ($49,464)
  //   Avg salary: ONS ASHE 2023 (~$44,500 USD)
  //   Cost of living: baseline (1.0)
  //   Housing: baseline (1.0)
  // ==========================================================================
  {
    code: 'GB',
    name: 'United Kingdom',
    nameLocal: 'United Kingdom',
    flag: '🇬🇧',
    continent: 'Europe',
    region: 'Northern Europe',
    culturalCluster: 'Anglo-Saxon',

    language: 'English',
    languages: ['en'],
    currency: {
      code: 'GBP',
      symbol: '£',
      priceMultiplier: 1.0,
      salaryMultiplier: 1.0,
    },

    demographics: {
      lifeExpectancy: { male: 79, female: 83 },
      partnershipAgeAverage: { male: 30, female: 28 },
      marriageAgeAverage: { male: 33, female: 31 },
      firstChildAgeAverage: { male: 33, female: 30 },
      averageChildrenPerFamily: 1.6,
      retirementAge: 66,
      adultAge: 18,
      educationIndex: 0.928,
      crimeIndex: 46.0,
      happinessIndex: 6.75,
      giniCoefficient: 0.355,
    },

    economics: {
      gdpPerCapita: 49464,
      averageSalary: 44500,
      medianSalary: 35000,
      inflationRate: 7.3,
      unemploymentRate: 4.0,
      costOfLivingIndex: 1.00,
      housingPriceIndex: 1.00,
    },

    education: {
      schoolStartAge: 5,
      compulsoryUntilAge: 18,
      universityDuration: { bachelor: 3, master: 1 },
      tuitionAnnual: { public: 9250, private: 30000 },
      gpaScale: 'UK_class',
      stages: [],
    },

    career: {
      minimumWageMonthly: 1813,
      averageWorkWeek: 37,
      paidVacationDays: 28,
      careerCulture: 'merit',
      prominentIndustries: [],
      jobs: [],
    },

    cities: [],

    housing: {
      rentMedianMonthly: 1300,
      ownershipRate: 0.63,
      typicalMortgageYears: 25,
      propertyTypes: ['apartment', 'rowhouse', 'detached', 'townhouse'],
      medianPropertyPrice: 290000,
    },

    healthcare: {
      system: 'universal',
      annualCostBaseline: 0,
      qualityIndex: 80,
      insuranceMandatory: false,
    },

    legal: {
      drinkingAge: 18,
      smokingAge: 18,
      legalMarriageAge: 18,
      drivingAge: 17,
      votingAge: 18,
      softDrugsLegal: false,
      sameSexMarriage: true,
      deathPenalty: false,
      gamblingLegal: true,
      militaryService: 'voluntary',
      incomeTaxTopRate: 0.45,
    },

    culture: {
      nameOrder: 'first_last',
      automotiveBrands: [
        'Ford',
        'Vauxhall',
        'BMW',
        'Mercedes-Benz',
        'Toyota',
      ],
      typicalLifePath:
        'A-levels to university or apprenticeship. Marriage in early thirties.',
    },

    names: {
      firstNamesMale: ['Oliver', 'George', 'Harry', 'Noah', 'Jack'],
      firstNamesFemale: ['Olivia', 'Amelia', 'Isla', 'Ava', 'Emily'],
      lastNames: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams'],
    },
  },

  // ==========================================================================
  // JAPAN — stub
  // ==========================================================================
  {
    code: 'JP',
    name: 'Japan',
    nameLocal: '日本',
    flag: '🇯🇵',
    continent: 'Asia',
    region: 'Eastern Asia',
    culturalCluster: 'East-Asian',

    language: 'Japanese',
    languages: ['ja'],
    currency: {
      code: 'JPY',
      symbol: '¥',
      priceMultiplier: 1.05,
      salaryMultiplier: 0.85,
    },

    demographics: {
      lifeExpectancy: { male: 81, female: 87 },
      partnershipAgeAverage: { male: 31, female: 30 },
      marriageAgeAverage: { male: 31, female: 30 },
      firstChildAgeAverage: { male: 33, female: 31 },
      averageChildrenPerFamily: 1.3,
      retirementAge: 65,
      adultAge: 18,
    },

    economics: {
      gdpPerCapita: 39312,
      averageSalary: 40000,
      medianSalary: 32000,
      inflationRate: 2.5,
      unemploymentRate: 2.6,
      costOfLivingIndex: 1.05,
      housingPriceIndex: 1.30,
    },

    education: {
      schoolStartAge: 6,
      compulsoryUntilAge: 15,
      universityDuration: { bachelor: 4, master: 2 },
      tuitionAnnual: { public: 535800, private: 950000 },
      gpaScale: 'JP_5',
      stages: [],
    },

    career: {
      minimumWageMonthly: 175000,
      averageWorkWeek: 40,
      paidVacationDays: 10,
      careerCulture: 'seniority',
      prominentIndustries: [],
      jobs: [],
    },

    cities: [],

    housing: {
      rentMedianMonthly: 100000,
      ownershipRate: 0.61,
      typicalMortgageYears: 35,
      propertyTypes: ['apartment', 'detached'],
      medianPropertyPrice: 38000000,
    },

    healthcare: {
      system: 'universal',
      annualCostBaseline: 200000,
      qualityIndex: 90,
      insuranceMandatory: true,
    },

    legal: {
      drinkingAge: 20,
      smokingAge: 20,
      legalMarriageAge: 18,
      drivingAge: 18,
      votingAge: 18,
      softDrugsLegal: false,
      sameSexMarriage: false,
      deathPenalty: true,
      gamblingLegal: false,
      militaryService: 'voluntary',
      incomeTaxTopRate: 0.45,
    },

    culture: {
      nameOrder: 'last_first',
      automotiveBrands: ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru'],
      typicalLifePath:
        'Education focus. Long career at one company. Late marriage.',
    },

    names: {
      firstNamesMale: ['Hiroshi', 'Takeshi', 'Kenji', 'Yuki', 'Daisuke'],
      firstNamesFemale: ['Yuki', 'Sakura', 'Hana', 'Aoi', 'Yui'],
      lastNames: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe'],
    },
  },

  // ==========================================================================
  // BRAZIL — stub
  // ==========================================================================
  {
    code: 'BR',
    name: 'Brazil',
    nameLocal: 'Brasil',
    flag: '🇧🇷',
    continent: 'South America',
    region: 'South America',
    culturalCluster: 'Latin-American',

    language: 'Portuguese',
    languages: ['pt'],
    currency: {
      code: 'BRL',
      symbol: 'R$',
      priceMultiplier: 0.45,
      salaryMultiplier: 0.35,
    },

    demographics: {
      lifeExpectancy: { male: 73, female: 80 },
      partnershipAgeAverage: { male: 26, female: 24 },
      marriageAgeAverage: { male: 30, female: 27 },
      firstChildAgeAverage: { male: 28, female: 26 },
      averageChildrenPerFamily: 1.7,
      retirementAge: 65,
      adultAge: 18,
    },

    economics: {
      gdpPerCapita: 9673,
      averageSalary: 8500,
      medianSalary: 6500,
      inflationRate: 4.6,
      unemploymentRate: 7.8,
      costOfLivingIndex: 0.45,
      housingPriceIndex: 0.35,
    },

    education: {
      schoolStartAge: 6,
      compulsoryUntilAge: 17,
      universityDuration: { bachelor: 4, master: 2 },
      tuitionAnnual: { public: 0, private: 25000 },
      gpaScale: 'percentage',
      stages: [],
    },

    career: {
      minimumWageMonthly: 1518,
      averageWorkWeek: 44,
      paidVacationDays: 30,
      careerCulture: 'mixed',
      prominentIndustries: [],
      jobs: [],
    },

    cities: [],

    housing: {
      rentMedianMonthly: 2000,
      ownershipRate: 0.73,
      typicalMortgageYears: 30,
      propertyTypes: ['apartment', 'detached', 'condo'],
      medianPropertyPrice: 350000,
    },

    healthcare: {
      system: 'mixed',
      annualCostBaseline: 4000,
      qualityIndex: 65,
      insuranceMandatory: false,
    },

    legal: {
      drinkingAge: 18,
      smokingAge: 18,
      legalMarriageAge: 18,
      drivingAge: 18,
      votingAge: 16,
      softDrugsLegal: false,
      sameSexMarriage: true,
      deathPenalty: false,
      gamblingLegal: false,
      militaryService: 'mandatory_male',
      incomeTaxTopRate: 0.275,
    },

    culture: {
      nameOrder: 'first_last',
      automotiveBrands: ['Volkswagen', 'Fiat', 'Chevrolet', 'Toyota', 'Honda'],
      typicalLifePath:
        'Family-centered. Multi-generational households common.',
    },

    names: {
      firstNamesMale: ['Miguel', 'Arthur', 'Heitor', 'Bernardo', 'Davi'],
      firstNamesFemale: ['Helena', 'Alice', 'Laura', 'Maria', 'Sofia'],
      lastNames: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima'],
    },
  },

  // ==========================================================================
  // SOUTH AFRICA — stub
  // ==========================================================================
  {
    code: 'ZA',
    name: 'South Africa',
    nameLocal: 'South Africa',
    flag: '🇿🇦',
    continent: 'Africa',
    region: 'Southern Africa',
    culturalCluster: 'Sub-Saharan-African',

    language: 'English',
    languages: ['en', 'af', 'zu', 'xh'],
    currency: {
      code: 'ZAR',
      symbol: 'R',
      priceMultiplier: 0.4,
      salaryMultiplier: 0.3,
    },

    demographics: {
      lifeExpectancy: { male: 62, female: 68 },
      partnershipAgeAverage: { male: 28, female: 26 },
      marriageAgeAverage: { male: 32, female: 29 },
      firstChildAgeAverage: { male: 28, female: 25 },
      averageChildrenPerFamily: 2.3,
      retirementAge: 60,
      adultAge: 18,
    },

    economics: {
      gdpPerCapita: 6680,
      averageSalary: 12000,
      medianSalary: 8000,
      inflationRate: 5.4,
      unemploymentRate: 32.1,
      costOfLivingIndex: 0.40,
      housingPriceIndex: 0.30,
    },

    education: {
      schoolStartAge: 6,
      compulsoryUntilAge: 15,
      universityDuration: { bachelor: 3, master: 2 },
      tuitionAnnual: { public: 60000, private: 120000 },
      gpaScale: 'percentage',
      stages: [],
    },

    career: {
      minimumWageMonthly: 4400,
      averageWorkWeek: 45,
      paidVacationDays: 21,
      careerCulture: 'merit',
      prominentIndustries: [],
      jobs: [],
    },

    cities: [],

    housing: {
      rentMedianMonthly: 9000,
      ownershipRate: 0.6,
      typicalMortgageYears: 20,
      propertyTypes: ['apartment', 'detached', 'townhouse'],
      medianPropertyPrice: 1300000,
    },

    healthcare: {
      system: 'mixed',
      annualCostBaseline: 18000,
      qualityIndex: 60,
      insuranceMandatory: false,
    },

    legal: {
      drinkingAge: 18,
      smokingAge: 18,
      legalMarriageAge: 18,
      drivingAge: 18,
      votingAge: 18,
      softDrugsLegal: true,
      sameSexMarriage: true,
      deathPenalty: false,
      gamblingLegal: true,
      militaryService: 'voluntary',
      incomeTaxTopRate: 0.45,
    },

    culture: {
      nameOrder: 'first_last',
      automotiveBrands: ['Toyota', 'Volkswagen', 'Ford', 'BMW', 'Mercedes-Benz'],
      typicalLifePath:
        'Diverse paths. Strong family ties. Higher education increasingly valued.',
    },

    names: {
      firstNamesMale: ['Junior', 'Liam', 'Lethabo', 'Bandile', 'Karabo'],
      firstNamesFemale: ['Amahle', 'Lerato', 'Naledi', 'Zahra', 'Aaliyah'],
      lastNames: ['Nkosi', 'Dlamini', 'Khumalo', 'Mokoena', 'Botha'],
    },
  },
];

/**
 * Lookup a country by ISO-2 code. Falls back to NL rather than throwing —
 * the UI is built on the assumption that getCountry never fails, and a
 * stale save with an unknown code should still load.
 *
 * For new code, prefer the engine helpers in countryEngine.ts.
 */
export function getCountry(code: CountryCode): Country {
  return COUNTRIES.find((c) => c.code === code) ?? (COUNTRIES[0] as Country);
}
