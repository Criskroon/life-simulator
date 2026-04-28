import { describe, it, expect } from 'vitest';
import { COUNTRIES, getCountry } from '../../src/game/data/countries';
import {
  canEnterStage,
  getEducationStage,
} from '../../src/game/engine/educationEngine';
import {
  canAccessJob,
  getJob,
  getJobsForEducation,
} from '../../src/game/engine/careerEngine';
import {
  formatMoney,
  getCapital,
  getCity,
  getCountriesByContinent,
  getNameByAge,
  getRandomFirstName,
  getRandomFullName,
  getRandomLastName,
} from '../../src/game/engine/countryEngine';
import type { CountryCode } from '../../src/game/types/country';

describe('Country Engine — Foundation', () => {
  // ==========================================================
  // COUNTRIES table
  // ==========================================================
  describe('COUNTRIES table', () => {
    it('contains all 6 country codes', () => {
      const codes = COUNTRIES.map((c) => c.code).sort();
      expect(codes).toEqual(['BR', 'GB', 'JP', 'NL', 'US', 'ZA']);
    });

    it('each country has correct code', () => {
      expect(getCountry('NL').code).toBe('NL');
      expect(getCountry('US').code).toBe('US');
      expect(getCountry('GB').code).toBe('GB');
      expect(getCountry('JP').code).toBe('JP');
      expect(getCountry('BR').code).toBe('BR');
      expect(getCountry('ZA').code).toBe('ZA');
    });
  });

  // ==========================================================
  // getCountry
  // ==========================================================
  describe('getCountry', () => {
    it('returns correct country for NL', () => {
      const nl = getCountry('NL');
      expect(nl.name).toBe('Netherlands');
      expect(nl.flag).toBe('🇳🇱');
      expect(nl.continent).toBe('Europe');
    });

    it('returns correct country for JP', () => {
      const jp = getCountry('JP');
      expect(jp.name).toBe('Japan');
      expect(jp.continent).toBe('Asia');
    });
  });

  // ==========================================================
  // NL — Education
  // ==========================================================
  describe('NL Education', () => {
    const nl = getCountry('NL');

    it('has 9 education stages', () => {
      expect(nl.education.stages.length).toBe(9);
    });

    it('uses NL_10 GPA scale', () => {
      expect(nl.education.gpaScale).toBe('NL_10');
    });

    it('has selection at age 12 (unique NL feature)', () => {
      expect(nl.education.selectionAt).toBe(12);
    });

    it('has all expected stage IDs', () => {
      const ids = nl.education.stages.map((s) => s.id);
      expect(ids).toContain('basisschool');
      expect(ids).toContain('vmbo');
      expect(ids).toContain('havo');
      expect(ids).toContain('vwo');
      expect(ids).toContain('mbo');
      expect(ids).toContain('hbo_bachelor');
      expect(ids).toContain('wo_bachelor');
      expect(ids).toContain('wo_master');
      expect(ids).toContain('phd');
    });

    it('basisschool leads to vmbo, havo, vwo', () => {
      const basisschool = getEducationStage(nl, 'basisschool');
      expect(basisschool?.nextStages).toEqual(['vmbo', 'havo', 'vwo']);
    });

    it('vwo requires smarts 70+', () => {
      const vwo = getEducationStage(nl, 'vwo');
      expect(vwo?.requirements?.minSmarts).toBe(70);
    });

    it('PhD has tuitionAnnual 0 (paid position in NL)', () => {
      const phd = getEducationStage(nl, 'phd');
      expect(phd?.cost.tuitionAnnual).toBe(0);
    });
  });

  // ==========================================================
  // NL — Career
  // ==========================================================
  describe('NL Career', () => {
    const nl = getCountry('NL');

    it('has 18 jobs', () => {
      expect(nl.career.jobs.length).toBe(18);
    });

    it('has minimum wage 2304 (2026)', () => {
      expect(nl.career.minimumWageMonthly).toBe(2304);
    });

    it('has 36-hour work week', () => {
      expect(nl.career.averageWorkWeek).toBe(36);
    });

    it('has 25 paid vacation days', () => {
      expect(nl.career.paidVacationDays).toBe(25);
    });

    it('huisarts requires wo_master', () => {
      const huisarts = getJob(nl, 'doctor_gp_nl');
      expect(huisarts?.educationRequired).toContain('wo_master');
    });

    it('huisarts requires smarts 85+', () => {
      const huisarts = getJob(nl, 'doctor_gp_nl');
      expect(huisarts?.prerequisites?.minSmarts).toBe(85);
    });
  });

  // ==========================================================
  // NL — Cities
  // ==========================================================
  describe('NL Cities', () => {
    const nl = getCountry('NL');

    it('has 5 cities', () => {
      expect(nl.cities.length).toBe(5);
    });

    it('has Amsterdam as capital', () => {
      const capital = getCapital(nl);
      expect(capital?.id).toBe('amsterdam');
    });

    it('Amsterdam has high cost multiplier (1.4)', () => {
      const ams = getCity(nl, 'amsterdam');
      expect(ams?.costMultiplier).toBe(1.4);
    });

    it('Eindhoven is cheaper than average (0.85)', () => {
      const ein = getCity(nl, 'eindhoven');
      expect(ein?.costMultiplier).toBe(0.85);
    });
  });

  // ==========================================================
  // NL — Names
  // ==========================================================
  describe('NL Names', () => {
    const nl = getCountry('NL');

    it('has 50+ male first names', () => {
      expect(nl.names.firstNamesMale.length).toBeGreaterThanOrEqual(50);
    });

    it('has 50+ female first names', () => {
      expect(nl.names.firstNamesFemale.length).toBeGreaterThanOrEqual(50);
    });

    it('has 30+ last names', () => {
      expect(nl.names.lastNames.length).toBeGreaterThanOrEqual(30);
    });

    it('contains "Noah" as a male name (most popular 2024-2025)', () => {
      expect(nl.names.firstNamesMale).toContain('Noah');
    });

    it('contains "Noor" as a female name (most popular 2025)', () => {
      expect(nl.names.firstNamesFemale).toContain('Noor');
    });

    it('contains "De Jong" as a last name (most common in NL)', () => {
      expect(nl.names.lastNames).toContain('De Jong');
    });
  });

  // ==========================================================
  // canEnterStage
  // ==========================================================
  describe('canEnterStage', () => {
    const nl = getCountry('NL');

    it('player with VMBO can enter MBO', () => {
      expect(canEnterStage(nl, 'mbo', ['basisschool', 'vmbo'], 50)).toBe(true);
    });

    it('player without VWO cannot enter WO bachelor', () => {
      expect(canEnterStage(nl, 'wo_bachelor', ['basisschool', 'havo'], 80)).toBe(
        false,
      );
    });

    it('player with low smarts cannot enter VWO', () => {
      expect(canEnterStage(nl, 'vwo', ['basisschool'], 50)).toBe(false);
    });

    it('player with smarts 75 can enter VWO', () => {
      expect(canEnterStage(nl, 'vwo', ['basisschool'], 75)).toBe(true);
    });
  });

  // ==========================================================
  // canAccessJob
  // ==========================================================
  describe('canAccessJob', () => {
    const nl = getCountry('NL');
    const huisarts = getJob(nl, 'doctor_gp_nl')!;
    const cashier = getJob(nl, 'cashier_nl')!;

    it('player with VMBO cannot become huisarts', () => {
      expect(
        canAccessJob(huisarts, {
          age: 30,
          smarts: 90,
          completedEducationStageIds: ['basisschool', 'vmbo'],
        }),
      ).toBe(false);
    });

    it('player with WO master and smarts 90 can become huisarts', () => {
      expect(
        canAccessJob(huisarts, {
          age: 30,
          smarts: 90,
          completedEducationStageIds: [
            'basisschool',
            'vwo',
            'wo_bachelor',
            'wo_master',
          ],
        }),
      ).toBe(true);
    });

    it('teenager (16) without VMBO cannot be cashier', () => {
      expect(
        canAccessJob(cashier, {
          age: 16,
          smarts: 50,
          completedEducationStageIds: ['basisschool'],
        }),
      ).toBe(false);
    });

    it('17-year-old with VMBO can be cashier', () => {
      expect(
        canAccessJob(cashier, {
          age: 17,
          smarts: 50,
          completedEducationStageIds: ['basisschool', 'vmbo'],
        }),
      ).toBe(true);
    });
  });

  // ==========================================================
  // getJobsForEducation
  // ==========================================================
  describe('getJobsForEducation', () => {
    const nl = getCountry('NL');

    it('returns huisarts and lawyer for wo_master graduates', () => {
      const jobs = getJobsForEducation(nl, ['wo_master']);
      const ids = jobs.map((j) => j.id);
      expect(ids).toContain('doctor_gp_nl');
      expect(ids).toContain('lawyer_nl');
    });

    it('returns more jobs for HBO graduates than for VMBO graduates', () => {
      const hboJobs = getJobsForEducation(nl, [
        'basisschool',
        'havo',
        'hbo_bachelor',
      ]);
      const vmboJobs = getJobsForEducation(nl, ['basisschool', 'vmbo']);
      expect(hboJobs.length).toBeGreaterThan(vmboJobs.length);
    });
  });

  // ==========================================================
  // Name helpers
  // ==========================================================
  describe('Name helpers', () => {
    const nl = getCountry('NL');

    it('getRandomFirstName returns a string from the list', () => {
      const name = getRandomFirstName(nl, 'male');
      expect(nl.names.firstNamesMale).toContain(name);
    });

    it('getRandomLastName returns a string from the list', () => {
      const last = getRandomLastName(nl);
      expect(nl.names.lastNames).toContain(last);
    });

    it('getRandomFullName combines first and last', () => {
      const full = getRandomFullName(nl, 'female');
      expect(full).toMatch(/^\w+(\s\w+)+$/);
    });

    it('getNameByAge returns modern name for young child', () => {
      const name = getNameByAge(nl, 5, 'male');
      const modernNames = nl.names.firstNamesMale.slice(0, 15);
      expect(modernNames).toContain(name);
    });

    it('getNameByAge returns classic name for elderly', () => {
      const name = getNameByAge(nl, 80, 'male');
      // Elderly bucket starts at index 4 * floor(total/5).
      const classicStart = Math.floor(nl.names.firstNamesMale.length / 5) * 4;
      const classicNames = nl.names.firstNamesMale.slice(classicStart);
      expect(classicNames).toContain(name);
    });
  });

  // ==========================================================
  // Continents
  // ==========================================================
  describe('getCountriesByContinent', () => {
    it('returns NL and GB for Europe', () => {
      const codes = getCountriesByContinent('Europe').map((c) => c.code).sort();
      expect(codes).toEqual(['GB', 'NL']);
    });

    it('returns US for North America', () => {
      const countries = getCountriesByContinent('North America');
      expect(countries.length).toBe(1);
      expect(countries[0]?.code).toBe('US');
    });
  });

  // ==========================================================
  // formatMoney
  // ==========================================================
  describe('formatMoney', () => {
    it('formats EUR correctly', () => {
      expect(formatMoney(getCountry('NL'), 1000)).toBe('€1,000');
    });

    it('formats USD correctly', () => {
      expect(formatMoney(getCountry('US'), 5000)).toBe('$5,000');
    });
  });

  // ==========================================================
  // Consolidation: economics + legal coexist with gameplay content
  // ==========================================================
  describe('Country Engine — Consolidation', () => {
    it('NL has rich economics data', () => {
      const nl = getCountry('NL');
      expect(nl.economics.gdpPerCapita).toBe(65915);
      expect(nl.economics.costOfLivingIndex).toBe(0.97);
    });

    it('NL has full education and economics', () => {
      const nl = getCountry('NL');
      expect(nl.education.stages.length).toBe(9);
      expect(nl.economics.averageSalary).toBe(47500);
    });

    it('GB exists with baseline indices', () => {
      const gb = getCountry('GB');
      expect(gb.economics.costOfLivingIndex).toBe(1.0);
      expect(gb.economics.housingPriceIndex).toBe(1.0);
    });

    it('all 6 countries have economics data', () => {
      const codes: CountryCode[] = ['NL', 'US', 'GB', 'JP', 'BR', 'ZA'];
      for (const code of codes) {
        const country = getCountry(code);
        expect(country.economics).toBeDefined();
        expect(country.economics.gdpPerCapita).toBeGreaterThan(0);
      }
    });

    it('NL has correct flag emoji', () => {
      expect(getCountry('NL').flag).toBe('🇳🇱');
    });
  });
});
