export interface CareerLevel {
  title: string;
  /** Annual base salary in "country UK" units; multiplied by country.salaryMultiplier. */
  baseSalary: number;
  /** Years at current level required before promotion is offered. */
  yearsForPromotion: number;
  /** Min smarts required for entry/promotion to this level. */
  minSmarts: number;
}

export interface Career {
  id: string;
  name: string;
  /** Min age to take an entry-level job in this career. */
  minAge: number;
  /** Min education level required (matches EducationLevel ids). */
  requiresEducation?: string;
  levels: CareerLevel[];
}

export const CAREERS: Career[] = [
  {
    id: 'software',
    name: 'Software Developer',
    minAge: 18,
    requiresEducation: 'high_school',
    levels: [
      { title: 'Junior Developer', baseSalary: 38000, yearsForPromotion: 3, minSmarts: 50 },
      { title: 'Mid-level Developer', baseSalary: 60000, yearsForPromotion: 4, minSmarts: 60 },
      { title: 'Senior Developer', baseSalary: 90000, yearsForPromotion: 5, minSmarts: 70 },
      { title: 'Tech Lead', baseSalary: 130000, yearsForPromotion: 6, minSmarts: 80 },
    ],
  },
  {
    id: 'medicine',
    name: 'Doctor',
    minAge: 26,
    requiresEducation: 'graduate',
    levels: [
      { title: 'Resident', baseSalary: 55000, yearsForPromotion: 3, minSmarts: 75 },
      { title: 'Attending Physician', baseSalary: 180000, yearsForPromotion: 6, minSmarts: 80 },
      { title: 'Department Head', baseSalary: 280000, yearsForPromotion: 8, minSmarts: 85 },
    ],
  },
  {
    id: 'retail',
    name: 'Retail Worker',
    minAge: 16,
    levels: [
      { title: 'Cashier', baseSalary: 22000, yearsForPromotion: 2, minSmarts: 0 },
      { title: 'Shift Supervisor', baseSalary: 32000, yearsForPromotion: 3, minSmarts: 35 },
      { title: 'Store Manager', baseSalary: 48000, yearsForPromotion: 5, minSmarts: 50 },
      { title: 'Regional Manager', baseSalary: 78000, yearsForPromotion: 6, minSmarts: 60 },
    ],
  },
  {
    id: 'teaching',
    name: 'Teacher',
    minAge: 22,
    requiresEducation: 'university',
    levels: [
      { title: 'Substitute Teacher', baseSalary: 28000, yearsForPromotion: 2, minSmarts: 50 },
      { title: 'Teacher', baseSalary: 42000, yearsForPromotion: 4, minSmarts: 55 },
      { title: 'Senior Teacher', baseSalary: 56000, yearsForPromotion: 6, minSmarts: 60 },
      { title: 'Principal', baseSalary: 85000, yearsForPromotion: 8, minSmarts: 70 },
    ],
  },
  {
    id: 'trades',
    name: 'Tradesperson',
    minAge: 18,
    requiresEducation: 'high_school',
    levels: [
      { title: 'Apprentice Electrician', baseSalary: 30000, yearsForPromotion: 3, minSmarts: 40 },
      { title: 'Journeyman Electrician', baseSalary: 52000, yearsForPromotion: 5, minSmarts: 50 },
      { title: 'Master Electrician', baseSalary: 78000, yearsForPromotion: 7, minSmarts: 60 },
      { title: 'Contractor', baseSalary: 110000, yearsForPromotion: 10, minSmarts: 65 },
    ],
  },
];

export function getCareer(id: string): Career | undefined {
  return CAREERS.find((c) => c.id === id);
}
