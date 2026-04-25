/**
 * United Kingdom (GB) name pool.
 *
 * Sources: ONS top first names 1950–2020 (England & Wales, plus Scottish
 * additions), and ONS top surnames including the South-Asian and Caribbean
 * surnames that are normal in modern UK demographics. ~200 first names per
 * gender, 200+ surnames.
 *
 * UK pool is intentionally distinct from US: less Hispanic representation,
 * more Welsh/Scottish (Davies, Evans, MacDonald) and South-Asian (Patel,
 * Khan, Singh, Ali) which together make up a real chunk of the UK
 * surname distribution.
 */
import type { NameSet } from './types';

export const GB_NAMES: NameSet = {
  male: [
    // 1950s–1970s
    'John', 'David', 'Michael', 'Peter', 'Paul', 'Andrew', 'Mark', 'Stephen',
    'Richard', 'Robert', 'Christopher', 'Anthony', 'James', 'Simon', 'Martin',
    'Brian', 'Colin', 'Alan', 'Ian', 'Geoffrey', 'Trevor', 'Roger', 'Nigel',
    'Kevin', 'Gary', 'Neil', 'Graham', 'Philip', 'Tony', 'Barry', 'Keith',
    'Terry', 'Derek', 'Ronald', 'Frank', 'Alfred', 'George', 'Bernard',
    'Eric', 'Donald', 'Arthur', 'Leslie', 'Harold', 'Stanley', 'Ernest',
    'Cyril', 'Norman', 'Albert', 'Edward', 'Dennis', 'Roy', 'Ralph',
    // 1980s–1990s
    'Daniel', 'Matthew', 'Adam', 'Ryan', 'Lee', 'Craig', 'Jamie', 'Stuart',
    'Scott', 'Wayne', 'Lewis', 'Aaron', 'Connor', 'Liam', 'Jordan', 'Bradley',
    'Callum', 'Nathan', 'Jake', 'Owen', 'Luke', 'Dean', 'Rhys', 'Joel',
    'Ross', 'Carl', 'Adrian', 'Damian', 'Justin', 'Patrick', 'Sean',
    // 2000s–2020s
    'Oliver', 'George', 'Harry', 'Noah', 'Jack', 'Leo', 'Arthur', 'Muhammad',
    'Oscar', 'Charlie', 'William', 'Thomas', 'Henry', 'Theodore', 'Freddie',
    'Alfie', 'Archie', 'Joshua', 'Edward', 'Alexander', 'Isaac', 'Logan',
    'Sebastian', 'Lucas', 'Hugo', 'Reuben', 'Ezra', 'Finley', 'Theo', 'Jude',
    'Riley', 'Dylan', 'Mason', 'Toby', 'Jaxon', 'Zachary', 'Albie', 'Kai',
    'Tommy', 'Hunter', 'Caleb', 'Bobby', 'Rory', 'Elijah', 'Carter', 'Roman',
    // South-Asian-British
    'Mohammed', 'Ahmed', 'Ali', 'Hassan', 'Hussein', 'Ibrahim', 'Yusuf',
    'Omar', 'Bilal', 'Hamza', 'Imran', 'Adnan', 'Faisal', 'Tariq', 'Khalid',
    'Aarav', 'Arjun', 'Vihaan', 'Vivaan', 'Aditya', 'Krish', 'Ayaan', 'Reyansh',
    'Rohan', 'Dev', 'Ranveer', 'Karan', 'Siddharth', 'Anish', 'Pranav',
    // Caribbean-British / African-British
    'Andre', 'Marcus', 'Jermaine', 'Kwame', 'Kofi', 'Tyrone', 'Devon',
    'Ricardo', 'Trevon', 'Malachi', 'Elijah', 'Caleb', 'Isaiah', 'Micah',
    // Scottish / Welsh
    'Hamish', 'Angus', 'Fraser', 'Callum', 'Lachlan', 'Ewan', 'Murray',
    'Dougal', 'Innes', 'Iain', 'Rory', 'Ruairidh', 'Cameron', 'Duncan',
    'Gareth', 'Rhodri', 'Owain', 'Dafydd', 'Iolo', 'Geraint', 'Huw',
    'Dewi', 'Ifan', 'Bryn', 'Glyn', 'Llewelyn',
    // Polish / Eastern Euro (post-EU enlargement)
    'Jakub', 'Mateusz', 'Pawel', 'Piotr', 'Krzysztof', 'Tomasz', 'Marek',
    'Andrzej', 'Stanislaw', 'Adam', 'Wojciech',
  ],
  female: [
    // 1950s–1970s
    'Susan', 'Margaret', 'Patricia', 'Linda', 'Janet', 'Carol', 'Diane',
    'Christine', 'Pauline', 'Jean', 'Barbara', 'Elizabeth', 'Mary', 'Maureen',
    'Jacqueline', 'Anne', 'Sandra', 'Sheila', 'Brenda', 'Wendy', 'Karen',
    'Helen', 'Rosemary', 'Joan', 'Marion', 'Lesley', 'Jennifer', 'Hilary',
    'Beverley', 'Yvonne', 'Gillian', 'Pamela', 'Doreen', 'Audrey', 'Marjorie',
    'Eileen', 'Vera', 'Joyce', 'Edna', 'Iris', 'Norma', 'Ivy', 'Pearl',
    'Phyllis', 'Florence', 'Ada', 'Beryl',
    // 1980s–1990s
    'Sarah', 'Claire', 'Emma', 'Rachel', 'Nicola', 'Lisa', 'Joanne', 'Tracy',
    'Donna', 'Rebecca', 'Hannah', 'Laura', 'Charlotte', 'Sophie', 'Lucy',
    'Amy', 'Stephanie', 'Kelly', 'Vicky', 'Natalie', 'Samantha', 'Michelle',
    'Kerry', 'Gemma', 'Stacey', 'Leanne', 'Danielle', 'Becky', 'Sian',
    'Holly', 'Megan', 'Bethany', 'Abigail', 'Catherine', 'Victoria',
    // 2000s–2020s
    'Olivia', 'Amelia', 'Isla', 'Ava', 'Mia', 'Ivy', 'Lily', 'Isabella',
    'Rosie', 'Poppy', 'Sophia', 'Florence', 'Grace', 'Daisy', 'Evie',
    'Phoebe', 'Sienna', 'Willow', 'Freya', 'Elsie', 'Harper', 'Ella',
    'Alice', 'Maya', 'Ada', 'Bonnie', 'Aria', 'Matilda', 'Eva', 'Penelope',
    'Mila', 'Nancy', 'Hallie', 'Ruby', 'Maeve', 'Jessica', 'Erin',
    'Imogen', 'Beatrice', 'Eloise', 'Esme', 'Lyla', 'Robyn', 'Brooke',
    // South-Asian-British
    'Aisha', 'Fatima', 'Maryam', 'Zainab', 'Zara', 'Amira', 'Yasmin',
    'Layla', 'Hafsa', 'Nour', 'Salma', 'Aaliyah', 'Rania', 'Imani',
    'Anaya', 'Aanya', 'Riya', 'Aditi', 'Diya', 'Ishani', 'Saanvi',
    'Priya', 'Anjali', 'Kavya', 'Meera',
    // Caribbean-British / African-British
    'Amara', 'Imani', 'Kemi', 'Adaeze', 'Chioma', 'Folake', 'Sade',
    'Naomi', 'Ebony', 'Amber', 'Tiana', 'Kayla', 'Nia',
    // Scottish / Welsh / Irish
    'Iona', 'Catriona', 'Morag', 'Eilidh', 'Aileen', 'Mairi', 'Ishbel',
    'Niamh', 'Saoirse', 'Aoife', 'Roisin', 'Sinead', 'Caoimhe',
    'Cerys', 'Bronwen', 'Carys', 'Eirlys', 'Rhiannon', 'Megan', 'Ffion',
    'Gwen', 'Eira', 'Nia', 'Anwen',
    // Polish
    'Maja', 'Zuzanna', 'Julia', 'Lena', 'Hanna', 'Aleksandra', 'Wiktoria',
    'Natalia', 'Magdalena', 'Anna', 'Karolina', 'Beata',
  ],
  surnames: [
    // ONS top
    'Smith', 'Jones', 'Williams', 'Brown', 'Taylor', 'Davies', 'Wilson',
    'Evans', 'Thomas', 'Roberts', 'Johnson', 'Walker', 'Wright', 'Robinson',
    'Thompson', 'White', 'Hughes', 'Edwards', 'Green', 'Hall', 'Wood',
    'Harris', 'Lewis', 'Martin', 'Jackson', 'Clarke', 'Clark', 'Turner',
    'Hill', 'Scott', 'Cooper', 'Morris', 'Ward', 'Moore', 'King', 'Watson',
    'Baker', 'Harrison', 'Morgan', 'Patel', 'Young', 'Allen', 'Mitchell',
    'James', 'Anderson', 'Phillips', 'Lee', 'Bell', 'Parker', 'Davis',
    'Bennett', 'Carter', 'Cox', 'Marshall', 'Richardson', 'Cook', 'Bailey',
    'Murphy', 'Gray', 'Collins', 'Kelly', 'Price', 'Stewart', 'Adams',
    'Campbell', 'Shaw', 'Murray', 'Knight', 'Russell', 'Mason', 'Foster',
    'Holmes', 'Reynolds', 'Pearson', 'Stevens', 'Burton', 'Sutton', 'Webb',
    'Rogers', 'Saunders', 'Thomson', 'Hunter', 'Powell', 'Burns', 'Brooks',
    'Howard', 'Watts', 'Cole', 'Reid', 'Boyd', 'Wells', 'Riley', 'Bishop',
    'Long', 'Fox', 'Owen', 'Owens', 'Webster', 'Page', 'Jenkins', 'Carr',
    'Sanders', 'Wallace', 'Newton', 'Lawson', 'Bates', 'Marsh', 'Newman',
    'Mills', 'Allan', 'Ross', 'Dawson', 'Gardner', 'Gibson', 'Hawkins',
    'Lloyd', 'Lawrence', 'Sharp', 'Andrews', 'Pearce', 'Atkinson', 'May',
    'Day', 'Tucker', 'Gordon', 'Burgess', 'Banks', 'Gilbert', 'Read',
    'Holland', 'Bradley', 'Reeves', 'Pugh', 'Hayes', 'Lord', 'Ford',
    'Henderson', 'Dixon', 'George', 'Coleman', 'Townsend', 'Higgins',
    'Brookes', 'Curtis', 'Owens', 'Gough', 'Lambert', 'Knowles', 'Wilkinson',
    'Spencer', 'Booth', 'Black', 'Doyle',
    // Welsh / Scottish / Irish (more)
    'MacDonald', 'Macdonald', 'Mackenzie', 'Cameron', 'Stewart', 'Robertson',
    'Sinclair', 'Fraser', 'Sutherland', 'Murray', 'Henderson', 'McGregor',
    'Ferguson', 'Ross', 'McKay', 'McLeod', 'Munro', 'Morrison', 'Maclean',
    'Mackintosh', 'Buchanan', 'Hamilton', 'Wallace', 'Burns', 'Bruce',
    'Gallagher', 'O\'Brien', 'Byrne', 'O\'Sullivan', 'Walsh', 'Kelly',
    'Doyle', 'Quinn', 'Reilly', 'McCarthy', 'O\'Connor', 'Connolly',
    'Roberts', 'Davies', 'Hughes', 'Lewis', 'Owen', 'Pugh', 'Howell',
    'Vaughan', 'Bevan', 'Llewellyn', 'Powell', 'Cadwallader',
    // South-Asian
    'Patel', 'Khan', 'Singh', 'Ali', 'Begum', 'Hussain', 'Ahmed', 'Ahmad',
    'Rahman', 'Mahmood', 'Sharma', 'Kaur', 'Shah', 'Sheikh', 'Iqbal',
    'Malik', 'Aslam', 'Akhtar', 'Bibi', 'Anwar', 'Mirza', 'Khatun',
    'Choudhury', 'Chaudhry', 'Hossain', 'Mistry', 'Desai',
    // African / Caribbean
    'Williams', 'Campbell', 'Henry', 'Joseph', 'Pierre', 'Charles',
    'Francis', 'Williams', 'McKenzie', 'Bailey', 'Bennett', 'Edwards',
    'Adeyemi', 'Adebayo', 'Okafor', 'Okeke', 'Mensah', 'Boateng',
    'Asante', 'Owusu', 'Diallo', 'Sow',
    // Polish
    'Nowak', 'Kowalski', 'Wojcik', 'Kowalczyk', 'Wozniak', 'Kaminski',
    'Lewandowski', 'Zielinski', 'Szymanski', 'Wozniak', 'Dabrowski',
    // Other European
    'Schmidt', 'Mueller', 'Hoffmann', 'Wagner', 'Becker', 'Schneider',
    'Rossi', 'Russo', 'Bianchi', 'Romano', 'Costa',
  ],
};
