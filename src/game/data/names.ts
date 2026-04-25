import type { Gender } from '../types/gameState';

export type NamePool = 'english' | 'dutch';

interface NameSet {
  male: string[];
  female: string[];
  surnames: string[];
}

const ENGLISH: NameSet = {
  male: [
    'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
    'Thomas', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven',
    'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George', 'Edward',
    'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas',
    'Eric', 'Stephen', 'Jonathan', 'Larry', 'Justin', 'Scott', 'Brandon', 'Frank',
    'Benjamin', 'Gregory', 'Samuel', 'Raymond', 'Patrick', 'Alexander', 'Jack',
    'Dennis', 'Jerry', 'Tyler',
  ],
  female: [
    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan',
    'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Margaret', 'Betty', 'Sandra',
    'Ashley', 'Dorothy', 'Kimberly', 'Emily', 'Donna', 'Michelle', 'Carol',
    'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Laura', 'Sharon',
    'Cynthia', 'Kathleen', 'Amy', 'Shirley', 'Angela', 'Helen', 'Anna', 'Brenda',
    'Pamela', 'Nicole', 'Samantha', 'Katherine', 'Christine', 'Debra', 'Rachel',
    'Catherine', 'Carolyn', 'Janet', 'Ruth', 'Maria', 'Heather',
  ],
  surnames: [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
    'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
    'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
    'Carter', 'Roberts',
  ],
};

const DUTCH: NameSet = {
  male: [
    'Daan', 'Sem', 'Lucas', 'Milan', 'Liam', 'Levi', 'Luuk', 'Finn', 'Bram',
    'Noah', 'Jesse', 'Sam', 'Stijn', 'Thomas', 'Tim', 'Ruben', 'Mees', 'Gijs',
    'Max', 'Tom', 'Sven', 'Niels', 'Jens', 'Lars', 'Pieter', 'Wouter', 'Joris',
    'Bas', 'Rik', 'Jasper', 'Maarten', 'Hendrik', 'Willem', 'Floris', 'Casper',
    'Sander', 'Erik', 'Mark', 'Jeroen', 'Marco', 'Robin', 'Olivier', 'Hugo',
    'Boris', 'Jip', 'Roel', 'Bart', 'Kees', 'Dirk', 'Jan',
  ],
  female: [
    'Emma', 'Julia', 'Sophie', 'Anna', 'Lotte', 'Sara', 'Eva', 'Lisa', 'Lieke',
    'Femke', 'Iris', 'Noor', 'Tess', 'Fleur', 'Sanne', 'Mila', 'Saar', 'Liv',
    'Yara', 'Maud', 'Roos', 'Floor', 'Jasmijn', 'Esmee', 'Marit', 'Sterre',
    'Sara', 'Daphne', 'Ilse', 'Karlijn', 'Naomi', 'Anouk', 'Cato', 'Demi',
    'Britt', 'Pien', 'Janne', 'Hanna', 'Suze', 'Romy', 'Linde', 'Lena', 'Marieke',
    'Carolien', 'Annemarie', 'Wendy', 'Inge', 'Paula', 'Chantal', 'Petra',
  ],
  surnames: [
    'de Jong', 'Jansen', 'de Vries', 'van den Berg', 'van Dijk', 'Bakker', 'Janssen',
    'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'de Groot', 'Bos', 'Vos',
    'Peters', 'Hendriks', 'van Leeuwen', 'Dekker', 'Brouwer', 'de Wit', 'Dijkstra',
    'Smits', 'de Graaf', 'van der Meer', 'van der Linden', 'Kok', 'Jacobs',
    'de Haan', 'Vermeulen', 'van den Heuvel', 'van der Veen', 'van den Broek',
    'de Bruin', 'de Bruijn', 'van der Velde', 'Schouten', 'van Beek', 'Willems',
    'van Vliet', 'van de Ven', 'Hoekstra', 'Maas', 'Verhoeven', 'Koster', 'Prins',
    'Blom', 'Huisman', 'Peeters', 'Kuipers',
  ],
};

const POOLS: Record<NamePool, NameSet> = {
  english: ENGLISH,
  dutch: DUTCH,
};

function pickFrom<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)] as T;
}

export function randomFirstName(
  pool: NamePool,
  gender: Gender,
  rand: () => number = Math.random,
): string {
  const set = POOLS[pool];
  if (gender === 'male') return pickFrom(set.male, rand);
  if (gender === 'female') return pickFrom(set.female, rand);
  // Nonbinary: draw uniformly from both buckets.
  const combined = [...set.male, ...set.female];
  return pickFrom(combined, rand);
}

export function randomSurname(pool: NamePool, rand: () => number = Math.random): string {
  return pickFrom(POOLS[pool].surnames, rand);
}
