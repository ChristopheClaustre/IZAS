import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js';
import { getDatabase, ref, push, set, get, onValue } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js";
import * as utils from "./utils.js"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPa6Nd30O1YrC8K1HIB052dZ6KCkyUFcA",
  authDomain: "izas-398321.firebaseapp.com",
  databaseURL: "https://izas-398321-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "izas-398321",
  storageBucket: "izas-398321.appspot.com",
  messagingSenderId: "119715811198",
  appId: "1:119715811198:web:a187efcf590e6f62f8ed2f"
};

// Initialize Firebase
export var app;
export var db;

export function connectToDB()
{
  app = initializeApp(firebaseConfig);
  db = getDatabase();
}

// const value
export const defaultPegman = { lat: 43.604579144543436, lng : 1.443364389561114 }; // Toulouse, place du capitole
export const defaultResources = { confort : 0, foods : 0, heal : 0 };
export const defaultPlayer = { resistance : 4, resistanceMax : 4 };
const partiesKey = "parties"
const resourcesKey = "resources"
const playersKey = "players"

const namesList = [
  "Abdonie", "Abeline", "Abélie", "Abelle", "Abigaelle", "Acacie", "Acaciane", "Acanthe", "Adalbaude", "Adegrine", "Adélaïde", "Adèle", "Adélie", "Adeline", "Adeltrude", "Adolphine", "Adolphie", "Adonise", "Adrastée", "Adrehilde", "Adrienne", "Agathe", "Agatha", "Agilberte", "Aglaé", "Agnane", "Agneflète", "Agnès", "Agrippine", "Aigline", "Aimée", "Alaine", "Alaïs", "Albane", "Albérade", "Albérique", "Albertine", "Alcidie", "Alcine", "Alcyone", "Aldegonde", "Alexandrine", "Alexanne", "Alexine", "Alexane", "Alexiane", "Alice", "Aliénor", "Aliette", "Aline", "Alix", "Alizé", "Aloïse", "Aloyse", "Alphonsine", "Alphonsie", "Althée", "Amalberge", "Amauberge", "Amaliane", "Amalthée", "Amande", "Amandine", "Amante", "Amarande", "Amaranthe", "Amaryllis", "Ambre", "Ambrine", "Ambroisie", "Ambroisine", "Améliane", "Amélie", "Ameline", "Améthyste", "Amicie", "Aminte", "Anaëlle", "Anaïs", "Anastasie", "Anastasiane", "Anatolie", "Anatoline", "Anceline", "Andrée", "Anémone", "Angadrême", "Angèle", "Angeline", "Angélique", "Angilberte", "Anicée", "Anicette", "Annabelle", "Anne", "Annette", "Annick", "Annie", "Annonciade", "Ansberte", "Anstrudie", "Anthelmette", "Anthelmine", "Antigone", "Antoinette", "Antonine", "Aphélie", "Apolline", "Aquiline", "Arabelle", "Arcadie", "Archange", "Argine", "Ariane", "Aricie", "Arlette", "Armance", "Armande", "Armandine", "Armeline", "Armide", "Armelle", "Armine", "Arnaude", "Arsènie", "Arsinoé", "Artémis", "Arthurine", "Asceline", "Ascension", "Assomption", "Astarté", "Astérie", "Astrée", "Athalie", "Athanasie", "Athénaïs", "Aube", "Aubertine", "Aude", "Audrey", "Audeline", "Augustine", "Aure", "Aurélie", "Aurélienne", "Aurelle", "Auriane", "Aurore", "Auxane", "Aveline", "Avigaëlle", "Avoye", "Axeline", "Axelle", "Aymardine", "Aymonde", "Azalaïs", "Azalée", "Azélie", "Azeline", "Barbe", "Basilisse", "Bathilde", "Béatrice", "Bénédicte", "Benoîte", "Bérengère", "Bérénice", "Bernadette", "Berthe", "Bertille", "Bertrande", "Beuve", "Bibiane", "Blanche", "Blandine", "Bonne", "Brigitte", "Brune", "Brunehaut", "Brunehilde", "Brunissende", "Calliste", "Camille", "Candide", "Capucine", "Carine", "Carole", "Caroline", "Cassandre", "Cassiopée", "Catherine", "Cécile", "Céleste", "Célestine", "Céline", "Cerise", "Chantal", "Charlène", "Charline", "Charlotte", "Christelle", "Christiane", "Christine", "Claire", "Claude", "Claudette", "Claudine", "Clarisse", "Clélie", "Clémence", "Clémentine", "Clotilde", "Colette", "Coline", "Colombe", "Conception", "Constance", "Coralie", "Coraline", "Corentine", "Corinne", "Cunégonde", "Cyrielle", "Delphine", "Denise", "Désirée", "Diane", "Dieudonnée", "Dominique", "Domitille", "Donatienne", "Doriane", "Dorine", "Dorothée", "Douce", "Douceline", "Edmée", "Edmonde", "Églantine", "Eglé", "Éléonore", "Éliane", "Éliette", "Élisabeth", "Élise", "Élodie", "Éloïse", "Elvire", "Émeline", "Émérance", "Émérencie", "Émérencienne", "Émilie", "Émilienne", "Emmanuelle", "Épiphanie", "Éponine", "Ernestine", "Estelle", "Étiennette", "Eudoxie", "Eugénie", "Eulalie", "Euphrasie", "Euphrosine", "Eurydice", "Eusébie", "Évangéline", "Ève", "Évelyne", "Fabienne", "Fanny", "Fantine", "Faustine", "Félicie", "Fernande", "Firmine", "Flamine", "Flavie", "Fleur", "Flore", "Florence", "Florie", "Florine", "Fortunée", "France", "Francette", "Françoise", "Francine", "Frédérique", "Gaëlle", "Garance", "Geneviève", "Georgette", "Géraldine", "Gerberge", "Germaine", "Gersende", "Ghislaine", "Gilberte", "Ginette", "Gisèle", "Gismonde", "Godeleine", "Grace", "Graciane", "Gratienne", "Guenièvre", "Guillemette", "Guyonne", "Gustavine", "Gwenaëlle", "Gwendoline", "Harmonie", "Hadrienne", "Havoise", "Hélène", "Hélisende", "Héloïse", "Henriette", "Henryane", "Hermance", "Hermine", "Hermione", "Hersende", "Hippolyte", "Honorine", "Hortense", "Huguette", "Iphigénie", "Irène", "Iris", "Isabeau", "Isabelle", "Isaure", "Iseult", "Ismérie", "Jacinthe", "Jacqueline", "Jade", "Janine", "Jeanne", "Jeanne", "Jehanne", "Jocelyne", "Joëlle", "Joséphine", "Judith", "Julie", "Juliette", "Justine", "Lambertine", "Laure", "Laureline", "Laurence", "Lauriane", "Laurine", "Léocadie", "Léopoldine", "Léonie", "Léonne", "Liberte", "Lilas", "Liliane", "Line", "Lise", "Liseron", "Lorraine", "Louane", "Louise", "Louisette", "Luce", "Lucette", "Lucie", "Lucienne", "Lucille", "Ludivine", "Lydie", "Maclovie", "Madeleine", "Maëlle", "Magali", "Maguelone", "Maguelonne", "Mahaut", "Malvina", "Manon", "Marcelle", "Marceline", "Margot", "Margaux", "Marguerite", "Marianne", "Mariane", "Marie", "Mariette", "Marine", "Marion", "Marjolaine", "Marlène", "Marthe", "Martine", "Maryvonne", "Mathilde", "Mauricette", "Maxellende", "Maxime", "Maximilienne", "Mégane", "Mélanie", "Mélisse", "Mélisande", "Mélissandre", "Mélodie", "Mélusine", "Michèle", "Mireille", "Modestie", "Modestine", "Moïsette", "Monique", "Mylène", "Myrtille", "Nadège", "Nadine", "Nathalie", "Nicole", "Nine", "Noëlle", "Noélie", "Noémie", "Océane", "Octavie", "Odette", "Odile", "Olive", "Olympe", "Ombline", "Ondine", "Ophélie", "Orégane", "Oriande", "Oriane", "Orlane", "Palmyre", "Pascale", "Paule", "Paulette", "Pauline", "Pécine", "Pélagie", "Pénélope", "Pernelle", "Perrine", "Pétronille", "Philippine", "Philomène", "Philothée", "Pierrette", "Pomme", "Primerose", "Priscille", "Prudence", "Prune", "Pulchérie", "Quentine", "Quitterie", "Radegonde", "Raphaëlle", "Raymonde", "Régine", "Reine", "Réjeanne", "Renée", "Richarde", "Richilde", "Rictrude", "Rigoberte", "Roberte", "Rolande", "Romane", "Rosalie", "Rose", "Roseline", "Rosemonde", "Roxane", "Sabine", "Savine", "Sandrine", "Scholastique", "Ségolène", "Séphora", "Séraphine", "Servane", "Séverine", "Sibylle", "Sidonie", "Simone", "Sixtine", "Solange", "Soline", "Sophie", "Stéphanie", "Suzanne", "Suzette", "Suzie", "Suzon", "Sylviane", "Sylvie", "Sylvette", "Thalie", "Théodosie", "Thérèse", "Tiphaine", "Ursule", "Ursuline", "Valentine", "Valérie", "Valériane", "Véronique", "Victoire", "Vinciane", "Violaine", "Violette", "Virginie", "Viviane", "Xavière", "Yolande", "Ysaline", "Yseult", "Yvette", "Yvonne", "Yeva", "Zélie", "Zéphirine", "Abel", "Abélard", "Abelin", "Abraham", "Absalon", "Acace", "Achaire", "Achille", "Adalbéron", "Adam", "Adegrin", "Adelin", "Adelphe", "Adenet", "Adéodat", "Adhémar", "Adolphe", "Adrien", "Agapet", "Agathange", "Agathon", "Agilbert", "Agnan", "Agrippin", "Aimable", "Aimé", "Aimery", "Alain", "Alban", "Albéric", "Albert", "Alcibiade", "Alcide", "Alcime", "Aldonce", "Aldéric", "Aleaume", "Alexandre", "Alexis", "Alix", "Alliaume", "Almine", "Almire", "Aloïs", "Alphée", "Alphonse", "Alpinien", "Alverède", "Amaury", "Amandin", "Amant", "Ambroise", "Amédée", "Amélien", "Amic", "Amiel", "Amour", "Anastase", "Anatole", "Ancelin", "Andéol", "Andoche", "André", "Ange", "Angilbe", "Angilran", "Angoustan", "Anicet", "Anne", "Annibal", "Anthelme", "Antide", "Antoine", "Antonin", "Apollinaire", "Aquilin", "Arcade", "Archambaud", "Archange", "Archibald", "Arian", "Ariste", "Aristide", "Armand", "Armel", "Arnould", "Arnaud", "Arolde", "Arsène", "Arsinoé", "Arthaud", "Arthème", "Arthur", "Ascelin", "Astolphe", "Athanase", "Aubry", "Audebert", "Audouin", "Audran", "Auguste", "Aurèle", "Aurian", "Avenoel", "Aymard", "Aymeric", "Aymon", "Baptiste", "Barnabé", "Barthélemy", "Bartimée", "Basile", "Bastien", "Baudouin", "Bénigne", "Benjamin", "Benoît", "Béranger", "Bérard", "Bernard", "Bertrand", "Blaise", "Bohémond", "Bon", "Boniface", "Bouchard", "Briac", "Brice", "Brieuc", "Bruno", "Brunon", "Calixte", "Camélien", "Camille", "Camillien", "Candide", "Caribert", "Carloman", "Cassandre", "Cassien", "Cédric", "Céleste", "Célestin", "Célien", "Césaire", "César", "Charles", "Charlemagne", "Childebert", "Chilpéric", "Clodion", "Chrétien", "Christian", "Christodule", "Christophe", "Chrysole", "Chrysostome", "Claude", "Claudien", "Cléandre", "Clément", "Clotaire", "Clovis", "Colin", "Côme", "Constance", "Constant", "Constantin", "Corentin", "Corneille", "Cyprien", "Cyriaque", "Cyrille", "Dagobert", "Damien", "Daniel", "David", "Delphin", "Denis", "Désiré", "Didier", "Dieudonné", "Dominique", "Donatien", "Dorian", "Dorothée", "Edgard", "Edmond", "Édouard", "Efflam", "Éleuthère", "Élisée", "Elliott", "Elouan", "Élzéar", "Émile", "Emmanuel", "Enguerrand", "Épiphane", "Éric", "Esprit", "Étienne", "Eubert", "Eudes", "Eudoxe", "Eugène", "Eusèbe", "Eustache", "Évariste", "Évrard", "Erwan", "Fabien", "Fabrice", "Fantin", "Félicité", "Félix", "Ferdinand", "Fetnat", "Fiacre", "Fidèle", "Firmin", "Flavien", "Flodoard", "Florent", "Florestan", "Florian", "Florimond", "Fortuné", "Foucauld", "Foulques", "Francisque", "Francis", "François", "Frédéric", "Fulbert", "Fulcrand", "Fulgence", "Gabriel", "Gabin", "Gaël", "Garnier", "Galeran", "Gaston", "Gaspard", "Gatien", "Gaud", "Gautier", "Gédéon", "Geoffroy", "Georges", "Gérard", "Géraud", "Gerbert", "Germain", "Gervais", "Ghislain", "Gilbert", "Gilles", "Girart", "Gondebaud", "Gonthier", "Gontran", "Gonzague", "Grégoire", "Guérin", "Gui", "Guillaume", "Gustave", "Guy", "Guyot", "Gwenael", "Grégory", "Hardouin", "Hédelin", "Hélie", "Hélier", "Henri", "Herbert", "Herluin", "Hervé", "Hideo", "Hilaire", "Hincmar", "Hippolyte", "Honoré", "Hubert", "Innocent", "Isaac", "Isaïe", "Isabeau", "Isidore", "Jacob", "Jacques", "Jacques-André", "James", "Jason", "Jean", "Jeannot", "Jérémie", "Jérôme", "Jessé", "Job", "Jocelyn", "Joël", "Jonas", "Jonathan", "Joris", "Joseph", "Joseph-Marie", "Josse", "Josselin", "Jourdain", "Jude", "Judicaël", "Jules", "Julien", "Juste", "Justin", "Lambert", "Lancelot", "Landry", "Laurent", "Laurian", "Lazare", "Léandre", "Léon", "Léonard", "Léopold", "Leu", "Leufroy", "Libère", "Libert", "Liétald", "Lilian", "Lionel", "Loïc", "Longin", "Lorrain", "Lothaire", "Louis", "Louis-Auguste", "Loup", "Luc", "Lucien", "Ludolphe", "Ludovic", "Macaire", "Maël", "Malo", "Mamert", "Manassé", "Marc", "Marceau", "Marcel", "Marcelin", "Marius", "Martial", "Martin", "Mathieu", "Mathurin", "Matthias", "Maugis", "Maurice", "Maxence", "Maxime", "Maximilien", "Mayeul", "Médéric", "Melchior", "Mence", "Merlin", "Mérovée", "Michel", "Moïse", "Morgan", "Napoléon", "Narcisse", "Nathan", "Naudet", "Néhémie", "Nicéphore", "Nicolas", "Noé", "Noël", "Normand", "Octave", "Odilon", "Odon", "Oger", "Olivier", "Onesime", "Oury", "Oscar", "Orson", "Pacôme", "Parfait", "Pascal", "Paterne", "Patrice", "Paul", "Pépin", "Perceval", "Philémon", "Philibert", "Philippe", "Philothée", "Pie", "Pierre", "Pierrick", "Prosper", "Quentin", "Quirin", "Raphaël", "Raymond", "Réal", "Régis", "Réjean", "Rémi", "Renaud", "René", "Reybaud", "Richard", "Rigobert", "Robert", "Roch", "Rodolphe", "Rodrigue", "Roger", "Roland", "Romain", "Romuald", "Ronan", "Roselin", "Salomon", "Samuel", "Sauveur", "Savin", "Savinien", "Scholastique", "Sébastien", "Séraphin", "Serge", "Servan", "Séverin", "Sidoine", "Sigebert", "Sigismond", "Silvère", "Simon", "Sixte", "Sosthène", "Stéphane", "Sylvain", "Sylvestre", "Tancrède", "Tanguy", "Tarcise", "Taurin", "Thaddée", "Théodore", "Théodose", "Théophile", "Théophraste", "Thibault", "Thibert", "Thierry", "Thomas", "Timoléon", "Timothée", "Titien", "Titouan", "Tommy", "Tonnin", "Toussaint", "Trajan", "Tristan", "Turold", "Ulysse", "Urbain", "Ursin", "Ursmer", "Valentin", "Valère", "Valéry", "Venance", "Vianney", "Victor", "Victorien", "Victorin", "Vigile", "Vincent", "Virgile", "Vital", "Vivien", "Waleran", "Walfroy", "Wandrille", "Xavier", "Xénophon", "Yann", "Yannick", "Yvan", "Yoann", "Yves", "Zacharie", "Zaché", "Zénobe", "Zéphirin", "Zéphir"
]

// function utils
export function getPartiesRef(partyID)
{
  return ref(db, partiesKey + '/' + partyID);
}

export function createParty(createdCallback)
{
  push(ref(db, partiesKey + '/'), {pegman: defaultPegman, resources: defaultResources}).then((snapshot) => {
    createdCallback(snapshot.key);
  }).catch((error) => {
    utils.throwError("Error when creating new party (" + error + ")");
  });
}

export function createPlayer(partyID, playerID, createdCallback)
{
  set(ref(db, partiesKey + '/' + partyID + '/' + playersKey + '/' + playerID), defaultPlayer).then((snapshot) => {
    createdCallback();
  }).catch((error) => {
    utils.throwError("Error when creating new player (" + error + ")");
  });
}

export function displayResources(partyID, resource, changedCallback)
{
  onValue(ref(db, partiesKey + '/' + partyID + '/' + resourcesKey + '/' + resource), (snapshot) => {
    if (! snapshot.exists()) utils.throwError("Party ID \"" + partyID + "\" does not exist.");
    const data = snapshot.val();
    changedCallback(data);
  });
}

export function incrResources(partyID, resource, add = +1)
{
  var resourceRef = ref(db, partiesKey + '/' + partyID + '/' + resourcesKey + '/' + resource)
  
  get(resourceRef).then((snapshot) => {
    if (! snapshot.exists()) utils.throwError("Error when updating " + resource + " (" + error + ")");
    const data = snapshot.val();
    set(resourceRef, data+add).catch((error) => {
      utils.throwError("Error when updating " + resource + " (" + error + ")");
    });
  }).catch((error) => {
    utils.throwError("Error when updating " + resource + " (" + error + ")");
  });
}

export function setResource(partyID, resource, newValue)
{
  var resourceRef = ref(db, partiesKey + '/' + partyID + '/' + resourcesKey + '/' + resource)
  set(resourceRef, newValue).catch((error) => {
    utils.throwError("Error when updating " + resource + " (" + error + ")");
  });
}

export function randomName()
{
  const id = utils.getRandomInt(namesList.length);
  return namesList[id]
}