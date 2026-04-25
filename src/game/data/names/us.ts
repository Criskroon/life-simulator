/**
 * United States (US) name pool.
 *
 * Sources: SSA top first names by birth year 1950–2020 (spread across
 * decades for plausible age-name pairings) plus US Census 2010 most common
 * surnames (which captures Hispanic, Asian, and African-American family
 * names, not just Anglo). ~200 first names per gender, 200+ surnames.
 *
 * The surname mix is intentional: Garcia, Rodriguez, Nguyen, Patel, Kim
 * are all real top-100 US surnames. A US life that only ever produces
 * "Smith / Johnson / Williams" friends does not reflect the country.
 */
import type { NameSet } from './types';

export const US_NAMES: NameSet = {
  male: [
    // 1950s–1970s (older generation)
    'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
    'Thomas', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven',
    'Paul', 'Andrew', 'Kenneth', 'George', 'Edward', 'Ronald', 'Timothy', 'Jeffrey',
    'Gary', 'Stephen', 'Larry', 'Frank', 'Raymond', 'Patrick', 'Jack', 'Dennis',
    'Jerry', 'Walter', 'Arthur', 'Roger', 'Albert', 'Bruce', 'Wayne', 'Carl',
    'Harold', 'Eugene', 'Ralph', 'Russell', 'Roy', 'Earl', 'Bobby', 'Henry',
    'Howard', 'Norman', 'Stanley', 'Leonard', 'Phillip', 'Lawrence', 'Marvin',
    // 1980s–1990s (middle-aged)
    'Christopher', 'Brian', 'Kevin', 'Jason', 'Ryan', 'Jacob', 'Nicholas', 'Eric',
    'Jonathan', 'Justin', 'Scott', 'Brandon', 'Benjamin', 'Gregory', 'Samuel',
    'Alexander', 'Tyler', 'Aaron', 'Adam', 'Nathan', 'Zachary', 'Cody', 'Dustin',
    'Travis', 'Shawn', 'Joshua', 'Andrew', 'Sean', 'Eric', 'Derek', 'Jared',
    'Chad', 'Cory', 'Brent', 'Trevor', 'Marcus', 'Jeremy', 'Ian', 'Phillip',
    // 2000s–2020s (young)
    'Liam', 'Noah', 'Oliver', 'Elijah', 'Lucas', 'Mason', 'Logan', 'Ethan',
    'Aiden', 'Carter', 'Owen', 'Jackson', 'Wyatt', 'Caleb', 'Henry', 'Sebastian',
    'Hudson', 'Levi', 'Grayson', 'Mateo', 'Leo', 'Theo', 'Jaxon', 'Asher',
    'Theodore', 'Jameson', 'Lincoln', 'Maverick', 'Ezekiel', 'Beau', 'Silas',
    'Ezra', 'Kai', 'Cooper', 'Easton', 'Jude', 'Atlas', 'Rowan', 'Bennett',
    // Hispanic-American common
    'Jose', 'Juan', 'Carlos', 'Luis', 'Miguel', 'Jesus', 'Manuel', 'Pedro',
    'Antonio', 'Francisco', 'Diego', 'Mateo', 'Santiago', 'Daniel', 'Rafael',
    'Eduardo', 'Alejandro', 'Ricardo', 'Fernando', 'Javier', 'Hector',
    'Roberto', 'Gabriel', 'Adrian', 'Emiliano', 'Joaquin', 'Cesar',
    // African-American historically common
    'Marcus', 'Jamal', 'DeShawn', 'Tyrone', 'Andre', 'Malik', 'Darius',
    'Terrence', 'Jermaine', 'Darnell', 'Curtis', 'Reggie', 'Demetrius',
    'Maurice', 'Trevon', 'Jaden', 'Tariq', 'Khalil', 'Isaiah', 'Elijah',
    // Asian-American common
    'Wei', 'Ming', 'Jin', 'Hao', 'Kenji', 'Hiroshi', 'Takeshi', 'Akio',
    'Minh', 'Hai', 'Long', 'Tuan', 'Raj', 'Arjun', 'Vikram', 'Anish',
    'Dev', 'Rohan', 'Aarav', 'Krish', 'Sanjay', 'Amit', 'Ravi',
    // Other recent
    'Dominic', 'Jaxson', 'Caleb', 'Greyson', 'Roman', 'Kingston', 'Maximus',
    'Brooks', 'August', 'Knox', 'Jasper', 'Wesley', 'Ronan', 'Hugo',
    'Cole', 'Connor', 'Damian', 'Adriel', 'Gael', 'Rowan', 'Felix',
  ],
  female: [
    // 1950s–1970s
    'Mary', 'Patricia', 'Linda', 'Barbara', 'Susan', 'Margaret', 'Dorothy',
    'Nancy', 'Karen', 'Helen', 'Sandra', 'Donna', 'Carol', 'Sharon', 'Michelle',
    'Laura', 'Cynthia', 'Kathleen', 'Pamela', 'Janet', 'Catherine', 'Frances',
    'Christine', 'Debra', 'Joan', 'Diane', 'Ruth', 'Joyce', 'Virginia', 'Brenda',
    'Anne', 'Cheryl', 'Beverly', 'Marilyn', 'Bonnie', 'Judy', 'Janice', 'Wanda',
    'Lois', 'Phyllis', 'Gloria', 'Eileen', 'Eleanor', 'Kathy', 'Rita', 'Theresa',
    'Audrey', 'Irene', 'Betty', 'Doris', 'Marie', 'Florence', 'Edna',
    // 1980s–1990s
    'Jennifer', 'Lisa', 'Elizabeth', 'Jessica', 'Sarah', 'Amanda', 'Melissa',
    'Stephanie', 'Rebecca', 'Heather', 'Amy', 'Angela', 'Anna', 'Nicole',
    'Samantha', 'Katherine', 'Rachel', 'Carolyn', 'Maria', 'Tiffany', 'Crystal',
    'Tracy', 'Erin', 'Megan', 'Erica', 'Holly', 'Leah', 'Tara', 'Heidi',
    'Robin', 'Vanessa', 'Christina', 'Kristen', 'Andrea', 'Dawn', 'Natalie',
    'Kim', 'Renee', 'Misty', 'Brandy', 'Veronica', 'Allison', 'Alicia',
    // 2000s–2020s
    'Olivia', 'Emma', 'Ava', 'Sophia', 'Isabella', 'Mia', 'Charlotte',
    'Amelia', 'Harper', 'Evelyn', 'Abigail', 'Emily', 'Madison', 'Ella',
    'Avery', 'Sofia', 'Camila', 'Aria', 'Scarlett', 'Penelope', 'Layla',
    'Chloe', 'Victoria', 'Madelyn', 'Eleanor', 'Grace', 'Nora', 'Riley',
    'Zoey', 'Hannah', 'Hazel', 'Lily', 'Ellie', 'Violet', 'Lillian', 'Zoe',
    'Stella', 'Aurora', 'Natalie', 'Emilia', 'Everly', 'Leah', 'Aubrey',
    // Hispanic-American common
    'Sofia', 'Isabella', 'Camila', 'Valentina', 'Lucia', 'Maria', 'Ximena',
    'Mariana', 'Carmen', 'Gabriela', 'Ana', 'Andrea', 'Daniela', 'Adriana',
    'Veronica', 'Patricia', 'Esperanza', 'Guadalupe', 'Rosa', 'Juana',
    'Alejandra', 'Beatriz', 'Yolanda', 'Catalina',
    // African-American common
    'Aaliyah', 'Imani', 'Zaria', 'Jada', 'Aliyah', 'Nia', 'Layla', 'Amara',
    'Asia', 'Tiana', 'Kayla', 'Ebony', 'Latoya', 'Sade', 'Tamika', 'Latrice',
    'Yolanda', 'Shanice', 'Tanisha', 'Keisha',
    // Asian-American common
    'Mei', 'Lin', 'Jia', 'Ming', 'Hina', 'Yumi', 'Sakura', 'Aiko',
    'Linh', 'Mai', 'Hanh', 'Thuy', 'Priya', 'Anjali', 'Diya', 'Aanya',
    'Kavya', 'Riya', 'Saanvi', 'Aditi',
    // Recent additions
    'Luna', 'Willow', 'Nova', 'Ivy', 'Maeve', 'Iris', 'Wren', 'Skylar',
    'Brooklyn', 'Savannah', 'Kennedy', 'Adeline', 'Quinn', 'Ruby',
    'Rose', 'Genesis', 'Naomi', 'Aria', 'Cora', 'Vera', 'Margot',
  ],
  surnames: [
    // US Census 2010 top — Anglo
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis',
    'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson',
    'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Hill', 'Green',
    'Adams', 'Nelson', 'Baker', 'Hall', 'Campbell', 'Mitchell', 'Carter',
    'Roberts', 'Phillips', 'Evans', 'Turner', 'Parker', 'Edwards', 'Collins',
    'Stewart', 'Morris', 'Murphy', 'Cook', 'Rogers', 'Morgan', 'Peterson',
    'Cooper', 'Reed', 'Bailey', 'Bell', 'Gomez', 'Kelly', 'Howard',
    'Ward', 'Cox', 'Diaz', 'Richardson', 'Wood', 'Watson', 'Brooks',
    'Bennett', 'Gray', 'James', 'Reyes', 'Cruz', 'Hughes', 'Price',
    'Myers', 'Long', 'Foster', 'Sanders', 'Ross', 'Morales', 'Powell',
    'Sullivan', 'Russell', 'Ortiz', 'Jenkins', 'Gutierrez', 'Perry',
    'Butler', 'Barnes', 'Fisher', 'Henderson', 'Coleman', 'Simmons',
    'Patterson', 'Jordan', 'Reynolds', 'Hamilton', 'Graham', 'Kim',
    'Gonzales', 'Alexander', 'Ramos', 'Wallace', 'Griffin', 'West',
    'Cole', 'Hayes', 'Chavez', 'Gibson', 'Bryant', 'Ellis', 'Stevens',
    'Murray', 'Ford', 'Marshall', 'Owens', 'McDonald', 'Harrison',
    'Ruiz', 'Kennedy', 'Wells', 'Alvarez', 'Woods', 'Mendoza', 'Castillo',
    'Olson', 'Webb', 'Washington', 'Tucker', 'Freeman', 'Burns', 'Henry',
    'Vasquez', 'Snyder', 'Simpson', 'Crawford', 'Jimenez', 'Porter',
    'Mason', 'Shaw', 'Gordon', 'Wagner', 'Hunter', 'Romero', 'Hicks',
    'Dixon', 'Hunt', 'Palmer', 'Robertson', 'Black', 'Holmes', 'Stone',
    'Meyer', 'Boyd', 'Mills', 'Warren', 'Fox', 'Rose', 'Rice', 'Moreno',
    'Schmidt', 'Patel', 'Ferguson', 'Nichols', 'Herrera', 'Medina',
    // Hispanic
    'Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
    'Perez', 'Sanchez', 'Ramirez', 'Torres', 'Flores', 'Rivera', 'Aguilar',
    'Silva', 'Vargas', 'Castro', 'Soto', 'Delgado', 'Estrada', 'Contreras',
    'Salazar', 'Ortega', 'Guerrero', 'Munoz', 'Rojas', 'Cortez', 'Pena',
    'Solis', 'Galvan', 'Galindo', 'Cardenas', 'Cabrera', 'Padilla', 'Lara',
    // Asian-American
    'Nguyen', 'Tran', 'Le', 'Pham', 'Huynh', 'Vo', 'Phan', 'Bui', 'Dang',
    'Wong', 'Chen', 'Wang', 'Liu', 'Yang', 'Huang', 'Zhang', 'Lin', 'Chan',
    'Park', 'Choi', 'Cho', 'Yoon', 'Han', 'Shin', 'Kang', 'Ahn',
    'Patel', 'Singh', 'Kumar', 'Shah', 'Sharma', 'Gupta', 'Reddy', 'Desai',
    'Tanaka', 'Yamamoto', 'Sato', 'Suzuki', 'Takahashi', 'Watanabe',
    // Other immigrant
    'O\'Brien', 'Murphy', 'Kelly', 'Sullivan', 'Walsh', 'McCarthy',
    'Cohen', 'Goldberg', 'Levine', 'Klein', 'Rosenberg', 'Friedman',
    'Schwartz', 'Shapiro', 'Katz', 'Greenberg', 'Stein', 'Weiss',
    'Russo', 'Romano', 'Bruno', 'Esposito', 'Rizzo', 'Marino', 'Greco',
    'Costa', 'Caruso', 'Ricci', 'Bianchi', 'Ferrari', 'Martini',
    'Schmidt', 'Mueller', 'Schneider', 'Fischer', 'Wagner', 'Becker',
    'Ivanov', 'Petrov', 'Kowalski', 'Nowak', 'Wojcik', 'Kaminski',
    'Andersen', 'Larsen', 'Hansen', 'Olsen', 'Pedersen',
  ],
};
