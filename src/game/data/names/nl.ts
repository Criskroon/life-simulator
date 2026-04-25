/**
 * Dutch (NL) name pool.
 *
 * Sources: CBS / Meertens Instituut top voornamen 1950–2020 (spread across
 * decades so older NPCs read as plausibly older), plus most-common Dutch
 * surnames (CBS 2020). Approx. 200 first names per gender, 200+ surnames.
 *
 * Goal: diversity, not historical accuracy. A 70-year-old NPC named "Liam"
 * is wrong, but a 70-year-old "Pieter" or "Hendrik" reads correctly. Mixing
 * decades means age-balanced lives don't all get the same five 2010s names.
 */
import type { NameSet } from './types';

export const NL_NAMES: NameSet = {
  male: [
    // 1950s–1970s (older generation)
    'Jan', 'Pieter', 'Hendrik', 'Willem', 'Cornelis', 'Johannes', 'Gerrit', 'Klaas',
    'Dirk', 'Kees', 'Henk', 'Theo', 'Frans', 'Wim', 'Albert', 'Bernard', 'Anton',
    'Adriaan', 'Karel', 'Jacobus', 'Marinus', 'Leendert', 'Arie', 'Bert', 'Piet',
    'Sjaak', 'Toon', 'Herman', 'Hans', 'Rob', 'Ronald', 'Marcel', 'Edwin', 'Fred',
    // 1980s–1990s (middle-aged)
    'Mark', 'Erik', 'Joris', 'Bart', 'Maarten', 'Sander', 'Jeroen', 'Marco', 'Robin',
    'Olivier', 'Hugo', 'Boris', 'Jasper', 'Wouter', 'Roel', 'Floris', 'Casper',
    'Niels', 'Lars', 'Stijn', 'Bas', 'Rik', 'Tim', 'Tom', 'Sven', 'Jens', 'Jelle',
    'Pim', 'Patrick', 'Dennis', 'Michael', 'Martin', 'Roy', 'Ramon', 'Vincent',
    'Steven', 'Daniel', 'Tobias', 'Frank', 'Peter', 'Paul', 'Richard', 'Edgar',
    // 2000s–2020s (young)
    'Daan', 'Sem', 'Lucas', 'Milan', 'Liam', 'Levi', 'Luuk', 'Finn', 'Bram',
    'Noah', 'Jesse', 'Sam', 'Thomas', 'Ruben', 'Mees', 'Gijs', 'Max', 'Jip',
    'Olle', 'Teun', 'Senn', 'Mats', 'Tygo', 'Kai', 'Stan', 'Cas', 'Joep', 'Quinn',
    'Boaz', 'Thijs', 'Owen', 'Beau', 'Job', 'Siem', 'Lev', 'Bjorn', 'Niek',
    'Vince', 'Dean', 'Jay', 'Jurre', 'Tibbe', 'Loek', 'Sepp', 'Fos', 'Ezra',
    'Jurre', 'Damian', 'Adam', 'Mason', 'Ryan', 'Dani', 'Mohammed', 'Ali',
    'Ibrahim', 'Yusuf', 'Mehmet', 'Hassan', 'Anouar', 'Karim', 'Said', 'Rayan',
    'Amir', 'Omar', 'Ismail', 'Hamza', 'Bilal', 'Mustafa', 'Tariq', 'Bram',
    'Nathan', 'Lev', 'Filip', 'Ivan', 'Niko', 'Marek', 'Pawel', 'Stefan', 'Goran',
    'Aiden', 'Eden', 'Lev', 'Ravi', 'Arjun', 'Dev', 'Nils', 'Bo', 'Doris',
    'Joost', 'Reinier', 'Wessel', 'Ferdi', 'Sjoerd', 'Hidde', 'Bouke', 'Niels',
    'Mart', 'Tijn', 'Tijs', 'Lex', 'Olav', 'Brent', 'Jordy', 'Kaj', 'Tygo',
    'Jorrit', 'Iwan', 'Riad', 'Achmed', 'Khaled', 'Imran', 'Anwar', 'Adnan',
    'Faisal', 'Idris', 'Jaafar', 'Adil', 'Hicham', 'Ayoub', 'Sami', 'Wassim',
    'Daniel', 'Damien', 'Delano', 'Justin', 'Brandon', 'Gianni', 'Nick', 'Mike',
  ],
  female: [
    // 1950s–1970s
    'Maria', 'Johanna', 'Elisabeth', 'Cornelia', 'Anna', 'Wilhelmina', 'Hendrika',
    'Catharina', 'Adriana', 'Geertruida', 'Aaltje', 'Jacoba', 'Christina',
    'Margaretha', 'Theresia', 'Greetje', 'Riet', 'Truus', 'Annie', 'Toos',
    'Coby', 'Diny', 'Mien', 'Ria', 'Wil', 'Bep', 'Sjoukje', 'Henny', 'Tiny',
    'Joke', 'Marja', 'Ineke', 'Yvonne', 'Lia', 'Carla', 'Conny', 'Nel', 'Tilly',
    // 1980s–1990s
    'Marieke', 'Carolien', 'Annemarie', 'Wendy', 'Inge', 'Paula', 'Chantal',
    'Petra', 'Linda', 'Monique', 'Sandra', 'Mirjam', 'Brigitte', 'Daniëlle',
    'Manon', 'Suzanne', 'Marlies', 'Esther', 'Saskia', 'Hester', 'Karin',
    'Annet', 'Mariska', 'Astrid', 'Janneke', 'Lieke', 'Femke', 'Iris', 'Tess',
    'Fleur', 'Sanne', 'Eline', 'Roos', 'Floor', 'Jasmijn', 'Esmee', 'Marit',
    'Sterre', 'Daphne', 'Ilse', 'Karlijn', 'Naomi', 'Anouk', 'Cato', 'Demi',
    // 2000s–2020s
    'Emma', 'Julia', 'Sophie', 'Anna', 'Lotte', 'Sara', 'Eva', 'Lisa', 'Mila',
    'Saar', 'Liv', 'Yara', 'Maud', 'Britt', 'Pien', 'Janne', 'Hanna', 'Suze',
    'Romy', 'Linde', 'Lena', 'Noor', 'Olivia', 'Tess', 'Mia', 'Zoë', 'Elin',
    'Nina', 'Bo', 'Liz', 'Charlotte', 'Lize', 'Lara', 'Evi', 'Floortje', 'Maya',
    'Vera', 'Loïs', 'Esmée', 'Imke', 'Vajèn', 'Senna', 'Fenne', 'Norah', 'Ize',
    'Sophia', 'Amelia', 'Layla', 'Aya', 'Yasmine', 'Fatima', 'Amina', 'Salma',
    'Imane', 'Zara', 'Maryam', 'Hafsa', 'Khadija', 'Nour', 'Sara', 'Rania',
    'Anaïs', 'Camille', 'Chloé', 'Lara', 'Mia', 'Lucia', 'Stella', 'Elena',
    'Ivy', 'Ella', 'Marie', 'Annelore', 'Fenna', 'Bregje', 'Jet', 'Tygo',
    'Indy', 'Liva', 'Loua', 'Doutzen', 'Sien', 'Pleun', 'Roosmarijn', 'Lou',
    'Famke', 'Wiebke', 'Margriet', 'Trees', 'Greet', 'Tanja', 'Erika',
    'Helga', 'Heidi', 'Birgit', 'Dorien', 'Marloes', 'Else', 'Mieke', 'Dineke',
    'Anke', 'Nelleke', 'Wiesje', 'Ingrid', 'Mariëtte', 'Liesbeth', 'Henriette',
  ],
  surnames: [
    // CBS 2020 most-common
    'de Jong', 'Jansen', 'de Vries', 'van den Berg', 'van Dijk', 'Bakker', 'Janssen',
    'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'de Groot', 'Bos', 'Vos',
    'Peters', 'Hendriks', 'van Leeuwen', 'Dekker', 'Brouwer', 'de Wit', 'Dijkstra',
    'Smits', 'de Graaf', 'van der Meer', 'van der Linden', 'Kok', 'Jacobs',
    'de Haan', 'Vermeulen', 'van den Heuvel', 'van der Veen', 'van den Broek',
    'de Bruin', 'de Bruijn', 'van der Velde', 'Schouten', 'van Beek', 'Willems',
    'van Vliet', 'van de Ven', 'Hoekstra', 'Maas', 'Verhoeven', 'Koster', 'Prins',
    'Blom', 'Huisman', 'Peeters', 'Kuipers', 'van der Laan', 'van Wijk', 'Postma',
    'Kuiper', 'Veenstra', 'Kramer', 'van der Heijden', 'Mol', 'Scholten', 'Bosman',
    'Wolters', 'Driessen', 'van Beek', 'Aarts', 'van der Wal', 'Bouwman', 'Wagenaar',
    'Verheijen', 'Bosch', 'Schipper', 'Kuijpers', 'Verhagen', 'Nijhuis', 'Gerritsen',
    'Engel', 'Knoop', 'Nieuwenhuis', 'van der Wel', 'Heijmans', 'Geerts', 'Klaassen',
    'Beekman', 'Westerhof', 'Hofman', 'Boer', 'Stam', 'Vink', 'Lammers', 'Smeets',
    'Kruijswijk', 'van den Akker', 'Bisschop', 'Weijers', 'van Dam', 'Schoenmaker',
    'van Es', 'van Loon', 'Berends', 'Beumer', 'van Driel', 'Verbeek', 'Korver',
    'Bouma', 'van Halen', 'Heemskerk', 'Lubbers', 'Roest', 'Sanders', 'van Wijngaarden',
    'Krijgsman', 'Vermeer', 'Snijder', 'Bot', 'Tromp', 'Rensen', 'Vink', 'Klein',
    'Rikhof', 'Hommel', 'Drost', 'van den Hoek', 'Boender', 'Klaver', 'Storm',
    'Sluiter', 'Bakkers', 'Pijnacker', 'Marsman', 'van Buren', 'van Schaik', 'Holman',
    'van Gent', 'Bruggink', 'Eikelenboom', 'Bezuidenhout', 'Spaargaren', 'Doorn',
    'van der Zee', 'Heuvelman', 'Stoffels', 'Bulthuis', 'Renes', 'van Genderen',
    'Grootveld', 'Hoogerbrugge', 'Schurink', 'van Schendel', 'Schipperheijn',
    'Vroegop', 'Hartman', 'van der Pol', 'Bouwhuis', 'Knoll', 'Bovenkamp',
    'van Roon', 'Wessel', 'Kerkhof', 'Hopman', 'Bron', 'Nieuwland', 'Doornbos',
    'Ringeling', 'Aalders', 'Plantenga', 'Eshuis', 'Wieringa', 'Boomstra',
    'Kalis', 'van Wely', 'Krol', 'Bakhuijzen', 'Peerenboom', 'Meeuwsen',
    'Wagenmaker', 'Hilhorst', 'Heimans', 'van Daal', 'Kerssen', 'Daems',
    'Roelofsen', 'Buurman', 'van Putten', 'Wesseling', 'van Hall', 'Karelse',
    'Vlot', 'Mostert', 'Schalkwijk', 'Bezem', 'Plomp', 'Stigter', 'Korpershoek',
    'Pasman', 'van Dongen', 'Vreugdenhil', 'Tijhuis', 'Vermeijden', 'Sjouke',
    // Some Dutch-Indonesian, Surinamese, Moroccan-NL surnames for diversity
    'Pieterse', 'Marengo', 'Soemita', 'Ramautar', 'Sastromedjo', 'Sumardi',
    'El Amrani', 'Bouali', 'Benali', 'El Idrissi', 'Belhadj', 'Khan', 'Yilmaz',
    'Demir', 'Aydin', 'Kaya', 'Öztürk', 'Yildiz', 'Sahin', 'Çelik', 'Polat',
    'Nguyen', 'Tran', 'Tjon', 'Wong', 'Lim', 'Wijaya', 'Setiawan', 'Hartono',
    'Da Silva', 'Fernandes', 'Pereira', 'Mendes', 'Lopes',
  ],
};
