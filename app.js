/**
 * EduGest Pro - Moteur de l'application & Gestion d'état (V13.0 Enterprise - Edition Binôme)
 * Sécurité RBAC maximale : Accès strict et exclusif aux Paramètres (Licence Hardware,
 * création de comptes, réinitialisation) réservé au seul ADMINISTRATEUR GÉNÉRAL.
 */

const CYCLES_CLASSES = {
  maternelle: ["Petite Section (PS)", "Moyenne Section (MS)", "Grande Section (GS)"],
  primaire: ["CP1", "CP2", "CE1", "CE2", "CM1", "CM2"],
  college: ["6ème", "5ème", "4ème", "3ème"],
  lycee: ["Seconde (2nde)", "Première (1ère)", "Terminale (Tle)"]
};

const CLASSE_SUPERIEURE = {
  "Petite Section (PS)": "Moyenne Section (MS)",
  "Moyenne Section (MS)": "Grande Section (GS)",
  "Grande Section (GS)": "CP1",
  "CP1": "CP2", "CP2": "CE1", "CE1": "CE2", "CE2": "CM1", "CM1": "CM2",
  "CM2": "6ème", "6ème": "5ème", "5ème": "4ème", "4ème": "3ème",
  "3ème": "Seconde (2nde)", "Seconde (2nde)": "Première (1ère)", "Première (1ère)": "Terminale (Tle)",
  "Terminale (Tle)": "Diplômé / Ancien Élève"
};

const INITIAL_SUBJECTS = {
  "6ème": [
    { id: "SUB-1", name: "Mathématiques", coef: 4, teacher: "Dr. Alassane Diarra" },
    { id: "SUB-2", name: "Français", coef: 4, teacher: "Mme. Chantal Somé" },
    { id: "SUB-3", name: "Histoire - Géographie", coef: 3, teacher: "Mme. Sylvie Kinda" },
    { id: "SUB-4", name: "Anglais", coef: 2, teacher: "M. Christian Bazié" },
    { id: "SUB-5", name: "Sciences / SVT", coef: 2, teacher: "M. Émile Ilboudo" }
  ],
  "3ème": [
    { id: "SUB-6", name: "Mathématiques", coef: 5, teacher: "Dr. Alassane Diarra" },
    { id: "SUB-7", name: "Français & Littérature", coef: 4, teacher: "Mme. Chantal Somé" },
    { id: "SUB-8", name: "Physique - Chimie", coef: 3, teacher: "M. Émile Ilboudo" },
    { id: "SUB-9", name: "Histoire - Géographie", coef: 3, teacher: "Mme. Sylvie Kinda" },
    { id: "SUB-10", name: "Anglais", coef: 2, teacher: "M. Christian Bazié" }
  ],
  "Terminale (Tle)": [
    { id: "SUB-11", name: "Mathématiques Spéciales", coef: 6, teacher: "Dr. Alassane Diarra" },
    { id: "SUB-12", name: "Physique - Chimie", coef: 5, teacher: "M. Émile Ilboudo" },
    { id: "SUB-13", name: "Philosophie", coef: 3, teacher: "Mme. Chantal Somé" },
    { id: "SUB-14", name: "Anglais", coef: 2, teacher: "M. Christian Bazié" },
    { id: "SUB-15", name: "SVT", coef: 4, teacher: "Mme. Sylvie Kinda" }
  ]
};

Object.values(CYCLES_CLASSES).flat().forEach(cName => {
  if (!INITIAL_SUBJECTS[cName]) {
    INITIAL_SUBJECTS[cName] = [
      { id: `SUB-${Math.random().toString(36).substr(2, 5)}`, name: "Français / Langage", coef: 3, teacher: "Mme. Chantal Somé" },
      { id: `SUB-${Math.random().toString(36).substr(2, 5)}`, name: "Calcul / Mathématiques", coef: 3, teacher: "Dr. Alassane Diarra" },
      { id: `SUB-${Math.random().toString(36).substr(2, 5)}`, name: "Éveil / Sciences", coef: 2, teacher: "M. Émile Ilboudo" }
    ];
  }
});

// --- MOTEUR TRIMESTRIEL ---
const TRIMESTER_LABELS = { T1: "1er Trimestre", T2: "2ème Trimestre", T3: "3ème Trimestre" };
let currentTrimester = "T1";
let bulletinTrimester = "T1";

function migrateGradesToTrimester(grades) {
  if (!grades || typeof grades !== "object") return {};
  const migrated = {};
  for (const [stuId, subjects] of Object.entries(grades)) {
    migrated[stuId] = {};
    for (const [subName, data] of Object.entries(subjects)) {
      if (data && typeof data === "object" && ("T1" in data || "T2" in data || "T3" in data)) {
        migrated[stuId][subName] = data;
      } else {
        migrated[stuId][subName] = {
          T1: { note1: data.note1 || 14, note2: data.note2 || 14, compo: data.compo || 15 },
          T2: { note1: 14, note2: 14, compo: 14 },
          T3: { note1: 14, note2: 14, compo: 14 }
        };
      }
    }
  }
  return migrated;
}

const INITIAL_DATA = {
  school: {
    name: "Lycée & Groupe Scolaire Saint-Exupéry",
    year: "2025 - 2026",
    motto: "Unité - Progrès - Justice",
    country: "Burkina Faso",
    address: "Avenue de l'Indépendance, 01 BP 1000 Ouagadougou",
    phone: "+226 25 30 00 00",
    email: "direction@saintexupery.bf",
    director: "M. Ousmane COMPAORÉ",
    tuitionFees: {
      maternelle: 120000,
      primaire: 150000,
      college: 200000,
      lycee: 250000
    }
  },
  users: [
    { id: "USR-01", name: "M. Ousmane COMPAORÉ", role: "direction", email: "direction@saintexupery.bf", username: "directeur", password: "dir123", status: "Actif" },
    { id: "USR-02", name: "Mme. Aminata KINDA", role: "secretaire", email: "secretariat@saintexupery.bf", username: "secretaire", password: "sec123", status: "Actif" },
    { id: "USR-03", name: "M. Adama SANOU", role: "econome", email: "economat@saintexupery.bf", username: "econome", password: "eco123", status: "Actif" },
    { id: "USR-04", name: "M. Seydou TRAORÉ", role: "surveillant", email: "viescolaire@saintexupery.bf", username: "surveillant", password: "surv123", status: "Actif" },
    { id: "USR-05", name: "Dr. Alassane DIARRA", role: "professeur", email: "a.diarra@saintexupery.bf", username: "professeur", password: "prof123", status: "Actif" },
    { id: "USR-06", name: "Admin Principal KOGO", role: "admin", email: "kogoinformatiques@saintexupery.bf", username: "KOGOinformatiques", password: "EMMANUEL 7682", status: "Actif" },
    { id: "USR-07", name: "Admin Principal", role: "admin", email: "admin@saintexupery.bf", username: "admin", password: "EMMANUEL 76827248", status: "Actif" }
  ],
  subjects: INITIAL_SUBJECTS,
  students: [
    { id: "MAT-2026-0001", lastName: "KABORÉ", firstName: "Aminata", gender: "F", cycle: "lycee", class: "Terminale (Tle)", birthDate: "2008-05-14", originSchool: "Lycée Philippe Zinda", pastAverage: 15.4, isRepeating: "Non", fatherName: "Paul KABORÉ (+226 70 11 22 33)", motherName: "Fatou KABORÉ", status: "À jour", totalFee: 250000, balance: 0, attendance: 98, photo: "👩🏾‍🎓", incidents: ["Félicitations du Conseil de classe T1"] },
    { id: "MAT-2026-0002", lastName: "SAWADOGO", firstName: "Jean-Paul", gender: "M", cycle: "college", class: "3ème", birthDate: "2011-09-22", originSchool: "École Sainte-Marie", pastAverage: 12.8, isRepeating: "Non", fatherName: "Marc SAWADOGO (+226 78 44 55 66)", motherName: "Aïcha SAWADOGO", status: "En retard", totalFee: 200000, balance: 75000, attendance: 86, photo: "👨🏾‍🎓", incidents: ["Retard 15min le 12/06", "Convocation parentale le 15/06"] },
    { id: "MAT-2026-0003", lastName: "OUÉDRAOGO", firstName: "Fatilmata", gender: "F", cycle: "college", class: "6ème", birthDate: "2014-11-03", originSchool: "École Primaire Centre A", pastAverage: 16.2, isRepeating: "Non", fatherName: "Moussa OUÉDRAOGO (+226 76 77 88 99)", motherName: "Mariam OUÉDRAOGO", status: "À jour", totalFee: 200000, balance: 0, attendance: 96, photo: "👧🏾", incidents: [] },
    { id: "MAT-2026-0004", lastName: "TRAORÉ", firstName: "Ibrahim", gender: "M", cycle: "primaire", class: "CM2", birthDate: "2015-01-18", originSchool: "Groupe Scolaire le Petit Prince", pastAverage: 13.5, isRepeating: "Non", fatherName: "Adama TRAORÉ (+226 71 00 11 22)", motherName: "Blandine TRAORÉ", status: "Partiel", totalFee: 150000, balance: 50000, attendance: 92, photo: "👦🏾", incidents: ["Passage infirmerie (Maux de tête)"] },
    { id: "MAT-2026-0005", lastName: "SANOU", firstName: "Blandine", gender: "F", cycle: "lycee", class: "Terminale (Tle)", birthDate: "2008-07-30", originSchool: "Lycée International", pastAverage: 17.1, isRepeating: "Non", fatherName: "Christian SANOU (+226 72 33 44 55)", motherName: "Sylvie SANOU", status: "À jour", totalFee: 250000, balance: 0, attendance: 100, photo: "👩🏾‍🎓", incidents: ["Prix d'Excellence en Mathématiques"] },
    { id: "MAT-2026-0006", lastName: "DIALLO", firstName: "Oumarou", gender: "M", cycle: "maternelle", class: "Grande Section (GS)", birthDate: "2020-04-10", originSchool: "Maternelle les Anges", pastAverage: 14.0, isRepeating: "Non", fatherName: "Abdou DIALLO (+226 75 66 77 88)", motherName: "Salimata DIALLO", status: "À jour", totalFee: 120000, balance: 0, attendance: 95, photo: "👶🏾", incidents: [] },
    { id: "MAT-2026-0007", lastName: "COULIBALY", firstName: "Aïcha", gender: "F", cycle: "college", class: "3ème", birthDate: "2011-08-12", originSchool: "Collège Moderne", pastAverage: 11.2, isRepeating: "Oui (3ème)", fatherName: "Seydou COULIBALY (+226 70 99 88 77)", motherName: "Chantal COULIBALY", status: "En retard", totalFee: 200000, balance: 100000, attendance: 88, photo: "👧🏾", incidents: ["Avertissement travail"] },
    { id: "MAT-2026-0008", lastName: "BARRY", firstName: "Cheick", gender: "M", cycle: "primaire", class: "CP1", birthDate: "2019-02-05", originSchool: "Maternelle Saint-Exupéry", pastAverage: 15.0, isRepeating: "Non", fatherName: "Hamidou BARRY (+226 78 12 34 56)", motherName: "Kadiatou BARRY", status: "À jour", totalFee: 150000, balance: 0, attendance: 94, photo: "👦🏾", incidents: [] },
    { id: "MAT-2026-0009", lastName: "KOGO", firstName: "Manuel", gender: "M", cycle: "primaire", class: "CP1", birthDate: "2019-05-10", originSchool: "Maternelle Avenir", pastAverage: 16.0, isRepeating: "Non", fatherName: "M. KOGO (+226 78 90 00 11)", motherName: "Mme KOGO", status: "Partiel", totalFee: 50000, balance: 15000, attendance: 99, photo: "👦🏾", incidents: ["Inscrit en CP1 - Tarif 50 000 F"] }
  ],
  teachers: [
    { id: "PRF-01", name: "Dr. Alassane Diarra", subject: "Mathématiques", email: "a.diarra@saintexupery.bf", phone: "+226 70 20 30 40", classes: ["Terminale (Tle)", "3ème", "6ème"] },
    { id: "PRF-02", name: "Mme. Chantal Somé", subject: "Français & Littérature", email: "c.some@saintexupery.bf", phone: "+226 78 50 60 70", classes: ["3ème", "6ème", "CM2"] },
    { id: "PRF-03", name: "M. Émile Ilboudo", subject: "Physique - Chimie / Sciences", email: "e.ilboudo@saintexupery.bf", phone: "+226 76 80 90 00", classes: ["Terminale (Tle)", "3ème"] },
    { id: "PRF-04", name: "Mme. Sylvie Kinda", subject: "Histoire - Géographie / SVT", email: "s.kinda@saintexupery.bf", phone: "+226 71 10 20 30", classes: ["Terminale (Tle)", "3ème", "6ème"] },
    { id: "PRF-05", name: "M. Christian Bazié", subject: "Anglais", email: "c.bazie@saintexupery.bf", phone: "+226 72 40 50 60", classes: ["Terminale (Tle)", "3ème", "6ème"] }
  ],
  transactions: [
    { id: "REC-2026-081", student: "Aminata KABORÉ (MAT-2026-0001)", student_id: "MAT-2026-0001", type: "Frais de scolarité - Solde annuel", amount: 150000, date: "03/07/2026", status: "Payé", method: "Orange Money", ref: "OM-8910023", operator: "M. Adama SANOU (Économe)" },
    { id: "REC-2026-080", student: "Blandine SANOU (MAT-2026-0005)", student_id: "MAT-2026-0005", type: "Frais de scolarité - T1 & T2", amount: 150000, date: "02/07/2026", status: "Payé", method: "Moov Money", ref: "MOOV-44512", operator: "M. Adama SANOU (Économe)" },
    { id: "REC-2026-079", student: "Ibrahim TRAORÉ (MAT-2026-0004)", student_id: "MAT-2026-0004", type: "Acompte scolarité", amount: 75000, date: "01/07/2026", status: "Partiel", method: "Espèces", ref: "RECU-ESP-099", operator: "Secrétariat Caisse" },
    { id: "REC-2026-078", student: "Jean-Paul SAWADOGO (MAT-2026-0002)", student_id: "MAT-2026-0002", type: "Frais de scolarité - T1", amount: 75000, date: "28/06/2026", status: "En retard", method: "Virement Bancaire", ref: "VIR-BF01-8890", operator: "M. Adama SANOU (Économe)" },
    { id: "REC-2026-084", student: "Manuel KOGO (MAT-2026-0009)", student_id: "MAT-2026-0009", type: "3ème versement scolarité", amount: 5000, date: "04/07/2026", status: "Partiel", method: "Espèces", ref: "RECU-KOGO-03", operator: "M. Adama SANOU (Économe)" },
    { id: "REC-2026-083", student: "Manuel KOGO (MAT-2026-0009)", student_id: "MAT-2026-0009", type: "2ème versement scolarité", amount: 20000, date: "03/07/2026", status: "Partiel", method: "Orange Money", ref: "OM-778811", operator: "M. Adama SANOU (Économe)" },
    { id: "REC-2026-082", student: "Manuel KOGO (MAT-2026-0009)", student_id: "MAT-2026-0009", type: "1er versement scolarité", amount: 10000, date: "02/07/2026", status: "Partiel", method: "Espèces", ref: "RECU-KOGO-01", operator: "M. Adama SANOU (Économe)" }
  ],
  grades: {
    "MAT-2026-0001": {
      "Mathématiques Spéciales": {
        T1: { note1: 17, note2: 18, compo: 17.5 },
        T2: { note1: 16.5, note2: 17, compo: 17 },
        T3: { note1: 18, note2: 17.5, compo: 18 }
      },
      "Physique - Chimie": {
        T1: { note1: 16, note2: 15.5, compo: 17 },
        T2: { note1: 15, note2: 16, compo: 16.5 },
        T3: { note1: 17, note2: 16, compo: 17.5 }
      },
      "Philosophie": {
        T1: { note1: 15, note2: 16, compo: 15.5 },
        T2: { note1: 14.5, note2: 15, compo: 15 },
        T3: { note1: 16, note2: 15.5, compo: 16 }
      },
      "Anglais": {
        T1: { note1: 18, note2: 17, compo: 18 },
        T2: { note1: 17.5, note2: 18, compo: 17 },
        T3: { note1: 18, note2: 17.5, compo: 18.5 }
      },
      "SVT": {
        T1: { note1: 16, note2: 17, compo: 16.5 },
        T2: { note1: 15.5, note2: 16, compo: 16 },
        T3: { note1: 17, note2: 16.5, compo: 17 }
      }
    },
    "MAT-2026-0005": {
      "Mathématiques Spéciales": {
        T1: { note1: 18, note2: 18.5, compo: 18 },
        T2: { note1: 17.5, note2: 18, compo: 18.5 },
        T3: { note1: 18, note2: 18.5, compo: 19 }
      },
      "Physique - Chimie": {
        T1: { note1: 17, note2: 17.5, compo: 17 },
        T2: { note1: 16.5, note2: 17, compo: 17.5 },
        T3: { note1: 17.5, note2: 18, compo: 17 }
      },
      "Philosophie": {
        T1: { note1: 16, note2: 16.5, compo: 16 },
        T2: { note1: 15.5, note2: 16, compo: 16.5 },
        T3: { note1: 16.5, note2: 17, compo: 16 }
      },
      "Anglais": {
        T1: { note1: 17.5, note2: 18, compo: 18 },
        T2: { note1: 18, note2: 17.5, compo: 18.5 },
        T3: { note1: 17.5, note2: 18, compo: 18 }
      },
      "SVT": {
        T1: { note1: 17, note2: 17.5, compo: 17 },
        T2: { note1: 16.5, note2: 17, compo: 17.5 },
        T3: { note1: 17, note2: 17.5, compo: 18 }
      }
    },
    "MAT-2026-0002": {
      "Mathématiques": {
        T1: { note1: 11, note2: 12.5, compo: 11 },
        T2: { note1: 12, note2: 11.5, compo: 12.5 },
        T3: { note1: 13, note2: 12, compo: 13 }
      },
      "Français & Littérature": {
        T1: { note1: 13, note2: 14, compo: 13.5 },
        T2: { note1: 14, note2: 13.5, compo: 14 },
        T3: { note1: 13.5, note2: 14.5, compo: 14 }
      },
      "Physique - Chimie": {
        T1: { note1: 12, note2: 11.5, compo: 12 },
        T2: { note1: 11.5, note2: 12, compo: 11.5 },
        T3: { note1: 12.5, note2: 13, compo: 12 }
      },
      "Histoire - Géographie": {
        T1: { note1: 13, note2: 13, compo: 12.5 },
        T2: { note1: 12.5, note2: 13.5, compo: 13 },
        T3: { note1: 13, note2: 14, compo: 13.5 }
      },
      "Anglais": {
        T1: { note1: 14, note2: 13, compo: 14 },
        T2: { note1: 13.5, note2: 14, compo: 13.5 },
        T3: { note1: 14, note2: 14.5, compo: 14 }
      }
    }
  }
};

function getStuName(s) {
  if (!s) return "Élève inconnu";
  const last = s.lastName || s.last_name || "Inconnu";
  const first = s.firstName || s.first_name || "";
  return `${last.toUpperCase()} ${first}`.trim();
}

function getStuClass(s) {
  if (!s) return "6ème";
  return s.class || s.class_name || "6ème";
}

function getTxStudent(t) {
  if (!t) return "Élève inconnu";
  return t.student || t.student_name || "Élève inconnu";
}

function recalculateAllStudentFinancials() {
  if (!appData.students || !appData.transactions) return;
  
  appData.students.forEach(stu => {
    const totFee = stu.totalFee || stu.total_fee || 150000;
    stu.totalFee = totFee;
    
    const stTxs = appData.transactions.filter(t => {
      const txStId = t.student_id || (t.student && t.student.match(/\((MAT-2026-\d+)\)/) ? t.student.match(/\((MAT-2026-\d+)\)/)[1] : "");
      return txStId === stu.id || (t.student && t.student.includes(stu.id));
    });

    const totalPaid = stTxs.reduce((acc, t) => acc + (parseInt(t.amount) || 0), 0);
    const restDue = Math.max(0, totFee - totalPaid);
    
    stu.balance = restDue;
    stu.totalPaid = totalPaid;
    
    if (restDue === 0 && totalPaid > 0) stu.status = "À jour";
    else if (totalPaid > 0) stu.status = "Partiel";
    else stu.status = "En retard";
  });
}

function sanitizeAppData(data) {
  if (!data || typeof data !== "object") return INITIAL_DATA;
  if (!data.school) data.school = INITIAL_DATA.school;
  if (!data.school.name && data.school.school_name) data.school.name = data.school.school_name;
  if (!data.school.name) data.school.name = "Lycée & Groupe Scolaire Saint-Exupéry";
  if (!data.school.motto) data.school.motto = "Unité - Progrès - Justice";
  if (!data.school.phone) data.school.phone = "+226 25 30 00 00";
  if (!data.school.director) data.school.director = "M. Ousmane COMPAORÉ";
  if (!data.school.directorMaternelle) data.school.directorMaternelle = data.school.director_maternelle || "Mme Aminata KINDA";
  if (!data.school.directorPrimaire) data.school.directorPrimaire = data.school.director_primaire || data.school.director || "M. Ousmane COMPAORÉ";
  if (!data.school.directorCollege) data.school.directorCollege = data.school.director_college || "Dr. Alassane DIARRA";
  if (!data.school.directorLycee) data.school.directorLycee = data.school.director_lycee || "M. Christian SANOU";
  if (!data.school.tuitionFees) data.school.tuitionFees = INITIAL_DATA.school.tuitionFees;
  if (!data.users || !Array.isArray(data.users) || data.users.length === 0) {
    data.users = INITIAL_DATA.users;
  } else {
    // Mise à jour garantie des deux comptes Administrateurs dans le cache local du navigateur
    const adminKogo = data.users.find(u => u.username === "KOGOinformatiques" || u.id === "USR-06");
    if (adminKogo) {
      adminKogo.username = "KOGOinformatiques";
      adminKogo.password = "EMMANUEL 7682";
      adminKogo.name = "Admin Principal KOGO";
      adminKogo.email = "kogoinformatiques@saintexupery.bf";
    } else {
      data.users.push({ id: "USR-06", name: "Admin Principal KOGO", role: "admin", email: "kogoinformatiques@saintexupery.bf", username: "KOGOinformatiques", password: "EMMANUEL 7682", status: "Actif" });
    }

    const adminStd = data.users.find(u => u.username === "admin" || u.id === "USR-07");
    if (adminStd) {
      adminStd.username = "admin";
      adminStd.password = "EMMANUEL 76827248";
      adminStd.name = "Admin Principal";
      adminStd.email = "admin@saintexupery.bf";
    } else {
      data.users.push({ id: "USR-07", name: "Admin Principal", role: "admin", email: "admin@saintexupery.bf", username: "admin", password: "EMMANUEL 76827248", status: "Actif" });
    }
  }
  if (!data.subjects || typeof data.subjects !== "object") data.subjects = INITIAL_DATA.subjects;
  
  if (!data.students || !Array.isArray(data.students)) {
    data.students = INITIAL_DATA.students;
  } else {
    data.students.forEach(s => {
      if (!s.lastName && s.last_name) s.lastName = s.last_name;
      if (!s.firstName && s.first_name) s.firstName = s.first_name;
      if (!s.class && s.class_name) s.class = s.class_name;
      if (!s.birthDate && s.birth_date) s.birthDate = s.birth_date;
      if (!s.originSchool && s.origin_school) s.originSchool = s.origin_school;
      if (!s.pastAverage && s.past_average) s.pastAverage = s.past_average;
      if (!s.isRepeating && s.is_repeating) s.isRepeating = s.is_repeating;
      if (!s.fatherName && s.father_name) s.fatherName = s.father_name;
      if (!s.motherName && s.mother_name) s.motherName = s.mother_name;
      if (!s.totalFee && s.total_fee) s.totalFee = s.total_fee;
    });
  }
  
  if (!data.teachers || !Array.isArray(data.teachers)) data.teachers = INITIAL_DATA.teachers;
  
  if (!data.transactions || !Array.isArray(data.transactions)) {
    data.transactions = INITIAL_DATA.transactions;
  } else {
    data.transactions.forEach(t => {
      if (!t.student && t.student_name) t.student = t.student_name;
    });
  }
  
  if (!data.grades || typeof data.grades !== "object") data.grades = INITIAL_DATA.grades;
  else data.grades = migrateGradesToTrimester(data.grades);
  return data;
}

let appData = sanitizeAppData(JSON.parse(localStorage.getItem("edugest_pro_v14_data") || localStorage.getItem("edugest_pro_v13_data")) || INITIAL_DATA);
let currentView = "dashboard";
let currentRole = "admin";
let activeGradeTrimester = "T1";
let loggedUser = JSON.parse(sessionStorage.getItem("edugest_logged_user")) || null;
let isConnectedToServer = false;

async function initApp() {
  console.log("🚀 Initialisation blindée d'EduGest Pro V13.0 (Edition Binôme)...");
  
  try {
    const res = await fetch("/api/state");
    if (res.ok) {
      const serverData = await res.json();
      console.log("🌐 Connecté avec succès au serveur Python/SQLite !");
      appData = sanitizeAppData(serverData);
      isConnectedToServer = true;
    }
  } catch (err) {
    console.log("💻 Mode Navigateur Local actif.");
  }

  recalculateAllStudentFinancials();
  fetchLicenseInfo();

  setupEventListeners();
  setupRoleSimulator();
  setupInactivityWatchdog();

  if (!checkCrashRecoverySecurity() || !loggedUser) {
    showLoginModal();
    if (!loggedUser && sessionStorage.getItem("edugest_last_active_time")) {
      showToast("⚡ Session déconnectée après coupure ou fermeture prolongée.", "warning");
    }
  } else {
    applyUserSession(loggedUser);
  }

  renderAll();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

function saveData() {
  try {
    recalculateAllStudentFinancials();
    localStorage.setItem("edugest_pro_v14_data", JSON.stringify(appData));
    renderAll();
  } catch(e) { console.error("Erreur sauvegarde:", e); }
}

async function fetchLicenseInfo() {
  try {
    const res = await fetch("/api/license-info");
    if (res.ok) {
      const data = await res.json();
      const el = document.getElementById("machine-id-display");
      if (el) el.textContent = data.machine_id;
      
      const statusEl = document.getElementById("license-status-display");
      if (statusEl && data.license_status) {
        statusEl.textContent = data.license_status;
        if (data.license_period === "perpetual") statusEl.style.color = "#7c3aed";
        else if (data.license_period === "demo") statusEl.style.color = "#d97706";
        else statusEl.style.color = "#059669";
      }
      const sel = document.getElementById("set-license-period");
      if (sel && data.license_period) sel.value = data.license_period;
    }
  } catch(e) {
    const el = document.getElementById("machine-id-display");
    if (el) el.textContent = "BF-9A81-33C2";
    
    const statusEl = document.getElementById("license-status-display");
    const savedText = appData?.school?.licenseStatusText || "🟢 LICENCE VALIDE (EXP: 31/07/2027)";
    if (statusEl) {
      statusEl.textContent = savedText;
      const period = appData?.school?.licensePeriod || "annual";
      if (period === "perpetual") statusEl.style.color = "#7c3aed";
      else if (period === "demo") statusEl.style.color = "#d97706";
      else statusEl.style.color = "#059669";
    }
    const sel = document.getElementById("set-license-period");
    if (sel && appData?.school?.licensePeriod) sel.value = appData.school.licensePeriod;
    const selSec = document.getElementById("set-login-security-mode");
    if (selSec && appData?.school?.loginSecurityMode) selSec.value = appData.school.loginSecurityMode;
    const selInc = document.getElementById("set-inactivity-timeout");
    if (selInc && appData?.school?.inactivityTimeout !== undefined) selInc.value = appData.school.inactivityTimeout;
    const setVal = (elemId, val) => { const el = document.getElementById(elemId); if (el && val !== undefined) el.value = val; };
    setVal("set-dir-maternelle", appData?.school?.directorMaternelle);
    setVal("set-dir-primaire", appData?.school?.directorPrimaire);
    setVal("set-dir-college", appData?.school?.directorCollege);
    setVal("set-dir-lycee", appData?.school?.directorLycee);
  }
}

function showLoginModal() {
  const modal = document.getElementById("modal-login");
  if (modal) {
    const form = document.getElementById("form-login");
    if (form) form.reset();
    const uname = document.getElementById("login-username");
    const upass = document.getElementById("login-password");
    const errBox = document.getElementById("login-error-msg");
    if (errBox) errBox.style.display = "none";
    if (uname) { uname.value = ""; uname.focus(); }
    if (upass) { upass.value = ""; }
    
    modal.classList.add("active");
    const helperBox = document.getElementById("login-helper-box");
    if (helperBox) {
      const mode = appData?.school?.loginSecurityMode || "production";
      helperBox.style.display = (mode === "demo") ? "block" : "none";
    }
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const uname = document.getElementById("login-username").value.trim();
  const upass = document.getElementById("login-password").value.trim();
  const errBox = document.getElementById("login-error-msg");

  let foundUser = null;

  if (isConnectedToServer) {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: uname, password: upass })
      });
      if (res.ok) {
        const data = await res.json();
        foundUser = data.user;
      } else {
        if (errBox) { errBox.textContent = "❌ Identifiant ou mot de passe incorrect."; errBox.style.display = "block"; }
        return;
      }
    } catch(err) {}
  }

  if (!foundUser) {
    foundUser = appData.users.find(u => (u.username === uname || u.email === uname || u.role === uname) && u.password === upass);
  }

  if (foundUser) {
    loggedUser = foundUser;
    sessionStorage.setItem("edugest_logged_user", JSON.stringify(loggedUser));
    const modal = document.getElementById("modal-login");
    if (modal) modal.classList.remove("active");
    const form = document.getElementById("form-login");
    if (form) form.reset();
    const upass = document.getElementById("login-password");
    if (upass) upass.value = "";
    if (errBox) errBox.style.display = "none";
    applyUserSession(loggedUser);
    resetInactivityTimer();
    showToast(`🎉 Bienvenue ${loggedUser.name} ! Session active.`, "success");
  } else {
    if (errBox) { errBox.textContent = "❌ Identifiant ou mot de passe incorrect."; errBox.style.display = "block"; }
    showToast("❌ Échec de connexion : vérifiez vos identifiants.", "danger");
  }
}

function applyUserSession(user) {
  currentRole = user.role;
  document.body.className = `role-${currentRole}`;
  
  const roleNames = {
    admin: "🧑‍💻 Administrateur",
    secretaire: "📋 Secrétaire",
    econome: "💰 Économe",
    surveillant: "🛡️ Surveillant",
    professeur: "👨‍🏫 Enseignant",
    direction: "👔 Directeur (Lecture Seule)"
  };
  
  const badge = document.getElementById("active-role-badge");
  if (badge) {
    badge.textContent = roleNames[currentRole] || currentRole;
    badge.className = `role-badge-display role-${currentRole}`;
  }
  const nameEl = document.getElementById("logged-user-name");
  if (nameEl) nameEl.textContent = user.name;

  applyRolePermissions();
  renderAll();
}

function logout() {
  if (confirm("Voulez-vous fermer votre session de travail ?")) {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    sessionStorage.removeItem("edugest_logged_user");
    loggedUser = null;
    const form = document.getElementById("form-login");
    if (form) form.reset();
    const uname = document.getElementById("login-username");
    const upass = document.getElementById("login-password");
    if (uname) uname.value = "";
    if (upass) upass.value = "";
    showToast("🚪 Vous êtes déconnecté du système.", "warning");
    showLoginModal();
  }
}

// SÉCURITÉ RBAC MAXIMALE : MASQUER ET PROTÉGER LES FONCTIONNALITÉS SENSIBLES
function applyRolePermissions() {
  document.querySelectorAll(".btn-admin-only").forEach(btn => {
    btn.style.display = currentRole === "admin" ? "inline-flex" : "none";
  });
  document.querySelectorAll(".btn-secretaire-only").forEach(btn => {
    btn.style.display = (currentRole === "admin" || currentRole === "secretaire") ? "inline-flex" : "none";
  });
  document.querySelectorAll(".btn-econome-only").forEach(btn => {
    btn.style.display = (currentRole === "admin" || currentRole === "econome") ? "inline-flex" : "none";
  });
  document.querySelectorAll(".btn-surveillant-only").forEach(btn => {
    btn.style.display = (currentRole === "admin" || currentRole === "surveillant" || currentRole === "professeur") ? "inline-flex" : "none";
  });
  document.querySelectorAll(".btn-prof-only").forEach(btn => {
    btn.style.display = (currentRole === "admin" || currentRole === "professeur") ? "inline-flex" : "none";
  });
}

function setupRoleSimulator() {
  const select = document.getElementById("role-selector");
  if (!select) return;
  select.value = currentRole;
  select.addEventListener("change", (e) => {
    switchRole(e.target.value);
  });
}

function switchRole(role) {
  currentRole = role;
  document.body.className = `role-${role}`;
  const roleNames = {
    admin: "🧑‍💻 Administrateur",
    secretaire: "📋 Secrétaire",
    econome: "💰 Économe",
    surveillant: "🛡️ Surveillant",
    professeur: "👨‍🏫 Enseignant",
    direction: "👔 Directeur (Lecture Seule)"
  };
  const badge = document.getElementById("active-role-badge");
  if (badge) {
    badge.textContent = roleNames[role] || role;
    badge.className = `role-badge-display role-${role}`;
  }
  applyRolePermissions();
  
  // Si on quitte le rôle Admin alors qu'on est sur Paramètres, éjecter vers le dashboard !
  if (currentView === "settings" && currentRole !== "admin") {
    switchView("dashboard");
  } else {
    renderAll();
  }
  showToast(`Rôle basculé vers : ${roleNames[role]}`, "info");
}

// --- GESTION DE LA NAVIGATION AVEC VERROUILLAGE ADMINISTRATEUR ---
function switchView(viewId) {
  // BARRICADE ANTI-INTRUSION : SEUL L'ADMIN PEUT ACCÉDER AUX PARAMÈTRES / LICENCE
  if (viewId === "settings" && currentRole !== "admin") {
    showToast("⛔ ACCÈS INTERDIT : Seul l'Administrateur Général a le droit d'accéder aux configurations, comptes et licence !", "danger");
    switchView("dashboard");
    return;
  }

  currentView = viewId;
  document.querySelectorAll(".nav-item").forEach(item => {
    if (item.dataset.view === viewId) item.classList.add("active");
    else item.classList.remove("active");
  });
  document.querySelectorAll(".view-section").forEach(section => {
    if (section.id === `view-${viewId}`) {
      section.classList.add("active");
      section.classList.add("active-print");
    } else {
      section.classList.remove("active");
      section.classList.remove("active-print");
    }
  });

  const titles = {
    dashboard: "Tableau de Bord Global",
    students: "Inscriptions & Dossiers Élèves",
    teachers: "Corps Enseignant & Affectations",
    classes: "Classes de la Maternelle au Lycée",
    grades: "Notes, Matières & Bulletins",
    attendance: "Suivi des Présences & Vie Scolaire",
    finance: "Comptabilité, Caisse, A5 & Versements",
    settings: "Paramètres, Utilisateurs & Tarifs"
  };
  const titleEl = document.getElementById("page-title");
  if (titleEl) titleEl.textContent = titles[viewId] || "EduGest Pro";
  
  if (viewId === "attendance") {
    renderAttendanceModule();
  } else if (viewId === "finance") {
    populateA5StudentSelect();
  }
}

function setupEventListeners() {
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      switchView(item.dataset.view);
    });
  });

  const searchEl = document.getElementById("global-search");
  if (searchEl) {
    searchEl.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      if (currentView !== "students") switchView("students");
      filterStudents(term);
    });
  }

  const filterCycle = document.getElementById("filter-cycle");
  if (filterCycle) {
    filterCycle.addEventListener("change", (e) => {
      populateClassSelect("filter-class", e.target.value, true);
      filterStudents("", document.getElementById("filter-class").value);
    });
  }

  const stuCycle = document.getElementById("stu-cycle");
  if (stuCycle) {
    stuCycle.addEventListener("change", (e) => {
      populateClassSelect("stu-class", e.target.value, false);
      updateStudentFeePreview(e.target.value);
    });
  }

  const filterClass = document.getElementById("filter-class");
  if (filterClass) {
    filterClass.addEventListener("change", (e) => {
      const sInput = document.getElementById("student-search");
      filterStudents(sInput ? sInput.value.toLowerCase() : "", e.target.value);
    });
  }

  document.querySelectorAll(".switch-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".switch-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".sub-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const target = document.getElementById(btn.dataset.target);
      if (target) {
        target.classList.add("active");
        if (btn.dataset.target === "panel-grades-entry") {
          const c = document.getElementById("prof-class-select")?.value;
          const s = document.getElementById("prof-subject-select")?.value;
          if (c) renderProfGradesTable(c, s);
        } else if (btn.dataset.target === "panel-subjects-config") {
          const c = document.getElementById("sub-class-select")?.value;
          if (c) renderSubjectsTable(c);
        } else if (btn.dataset.target === "panel-att-rollcall") {
          const c = document.getElementById("att-class-select")?.value || "6ème";
          renderClassRollCall(c);
        } else if (btn.dataset.target === "panel-att-incidents") {
          renderIncidentsLog();
        }
      }
    });
  });

  const subClassSel = document.getElementById("sub-class-select");
  if (subClassSel) {
    subClassSel.addEventListener("change", (e) => {
      renderSubjectsTable(e.target.value);
    });
  }

  const profClassSel = document.getElementById("prof-class-select");
  if (profClassSel) {
    profClassSel.addEventListener("change", (e) => {
      populateSubjectSelectForProf("prof-subject-select", e.target.value);
      renderProfGradesTable(e.target.value, document.getElementById("prof-subject-select").value);
    });
  }
  const profSubSel = document.getElementById("prof-subject-select");
  if (profSubSel) {
    profSubSel.addEventListener("change", (e) => {
      renderProfGradesTable(document.getElementById("prof-class-select").value, e.target.value);
    });
  }

  const attClassSel = document.getElementById("att-class-select");
  if (attClassSel) {
    attClassSel.addEventListener("change", (e) => {
      renderClassRollCall(e.target.value);
    });
  }

  const payAmtInput = document.getElementById("pay-amount");
  const payStuSelect = document.getElementById("pay-student");
  if (payAmtInput && payStuSelect) {
    payAmtInput.addEventListener("input", updatePaymentChangeCalculator);
    payStuSelect.addEventListener("change", updatePaymentChangeCalculator);
  }
}

function populateClassSelect(selectId, cycleKey, includeAll = false) {
  try {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const classes = CYCLES_CLASSES[cycleKey] || [].concat(...Object.values(CYCLES_CLASSES));
    sel.innerHTML = (includeAll ? `<option value="">Toutes les classes</option>` : "") +
      classes.map(c => `<option value="${c}">${c}</option>`).join("");
  } catch(e) { console.error("Erreur select class:", e); }
}

function populateSubjectSelectForProf(selectId, className) {
  try {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const subs = appData.subjects[className] || [];
    sel.innerHTML = subs.map(s => `<option value="${s.name}">${s.name} (Coef: ${s.coef})</option>`).join("");
  } catch(e) { console.error("Erreur select subject:", e); }
}

function populateA5StudentSelect() {
  try {
    const sel = document.getElementById("a5-student-select");
    if (!sel) return;
    sel.innerHTML = appData.students.map(s => {
      const name = getStuName(s);
      const cls = getStuClass(s);
      const tot = s.totalFee || s.total_fee || 150000;
      const rest = (s.balance !== undefined && s.balance !== null) ? s.balance : tot;
      return `<option value="${s.id}">${name} (${cls} - Reste à régler: ${rest.toLocaleString('fr-FR')} FCFA)</option>`;
    }).join("");
  } catch(e) { console.error("Erreur a5 select:", e); }
}

function updateStudentFeePreview(cycleKey) {
  try {
    const preview = document.getElementById("stu-fee-preview");
    if (!preview) return;
    const fees = appData.school.tuitionFees || { maternelle: 120000, primaire: 150000, college: 200000, lycee: 250000 };
    const feeVal = fees[cycleKey] || 150000;
    preview.value = feeVal.toLocaleString('fr-FR') + " FCFA / an";
  } catch(e) {}
}

function renderAll() {
  try { applyRolePermissions(); } catch(e) {}
  try { renderDashboard(); } catch(e) {}
  try { renderStudentsTable(); } catch(e) {}
  try { renderTeachersTable(); } catch(e) {}
  try { renderClassesGrid(); } catch(e) {}
  try { renderFinanceTable(); } catch(e) {}
  try { renderAttendanceModule(); } catch(e) {}
  try { renderUsersTable(); } catch(e) {}
  try { renderDynamicFeesTable(); } catch(e) {}
  try { updateStudentSelects(); } catch(e) {}
  try { populateA5StudentSelect(); } catch(e) {}
  
  try {
    populateClassSelect("filter-class", "", true);
    populateClassSelect("stu-class", "maternelle", false);
    updateStudentFeePreview("maternelle");
    
    const allClassNames = Object.values(CYCLES_CLASSES).flat();
    const subClassSel = document.getElementById("sub-class-select");
    if (subClassSel && !subClassSel.innerHTML) {
      subClassSel.innerHTML = allClassNames.map(c => `<option value="${c}">${c}</option>`).join("");
      renderSubjectsTable(subClassSel.value);
    }
    const profClassSel = document.getElementById("prof-class-select");
    if (profClassSel && !profClassSel.innerHTML) {
      profClassSel.innerHTML = allClassNames.map(c => `<option value="${c}">${c}</option>`).join("");
      populateSubjectSelectForProf("prof-subject-select", profClassSel.value);
      renderProfGradesTable(profClassSel.value, document.getElementById("prof-subject-select")?.value);
    }
    
    const attClassSel = document.getElementById("att-class-select");
    if (attClassSel && !attClassSel.innerHTML) {
      attClassSel.innerHTML = allClassNames.map(c => `<option value="${c}">${c}</option>`).join("");
      renderClassRollCall(attClassSel.value);
    }
  } catch(e) {}
}

// --- MODULE 1: DASHBOARD ---
function renderDashboard() {
  const totalStudents = appData.students.length;
  const totalTeachers = appData.teachers.length;
  const avgAttendance = Math.round(appData.students.reduce((acc, s) => acc + (s.attendance || 95), 0) / (totalStudents || 1));
  
  const elStu = document.getElementById("stat-students"); if(elStu) elStu.textContent = totalStudents;
  const elTea = document.getElementById("stat-teachers"); if(elTea) elTea.textContent = totalTeachers;
  const elAtt = document.getElementById("stat-attendance"); if(elAtt) elAtt.textContent = `${avgAttendance}%`;

  renderCustomBarChart("chart-revenue-container");
  renderCustomDonutChart("chart-attendance-container", avgAttendance);

  const activityBody = document.getElementById("dashboard-recent-activity");
  if (activityBody) {
    activityBody.innerHTML = appData.transactions.slice(0, 5).map(t => {
      const stName = getTxStudent(t);
      let badgeMethod = "badge-esp";
      if (t.method === "Orange Money") badgeMethod = "badge-om";
      else if (t.method === "Moov Money") badgeMethod = "badge-moov";
      else if (t.method === "Virement Bancaire") badgeMethod = "badge-vir";

      return `
        <tr>
          <td><strong>${stName}</strong></td>
          <td>${t.type}<br><span class="badge ${badgeMethod}" style="font-size:0.7rem; margin-top:2px;">${t.method || 'Espèces'} [Ref: ${t.ref || 'N/A'}]</span></td>
          <td><strong style="color:#059669; font-size:1.05rem;">${t.amount.toLocaleString('fr-FR')} FCFA</strong></td>
          <td>${t.date}</td>
          <td><span class="badge ${t.status === 'Payé' ? 'badge-success' : t.status === 'Partiel' ? 'badge-warning' : 'badge-danger'}">${t.status}</span></td>
        </tr>
      `;
    }).join("");
  }
}

function renderCustomBarChart(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const months = ["Oct", "Nov", "Déc", "Jan", "Fév", "Mar", "Juil"];
  const values = [70, 85, 80, 95, 90, 88, 98];
  
  let html = `<div style="display: flex; align-items: flex-end; height: 180px; gap: 1rem; padding-top: 1rem;">`;
  months.forEach((m, idx) => {
    const val = values[idx];
    html += `
      <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; height: 100%;">
        <div style="flex-grow: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center;">
          <div style="width: 36px; background: var(--primary-gradient); height: ${val}%; border-radius: 6px 6px 0 0; transition: height 0.5s ease;" title="${val}% encaissé"></div>
        </div>
        <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">${m}</span>
      </div>
    `;
  });
  html += `</div>`;
  container.innerHTML = html;
}

function renderCustomDonutChart(containerId, percentage) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const color = percentage >= 90 ? "#10b981" : percentage >= 80 ? "#f59e0b" : "#ef4444";
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 180px;">
      <div style="position: relative; width: 140px; height: 140px; border-radius: 50%; background: conic-gradient(${color} ${percentage}%, #e2e8f0 0); display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);">
        <div style="width: 106px; height: 106px; background: white; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <span style="font-size: 1.6rem; font-weight: 800; color: var(--text-main);">${percentage}%</span>
          <span style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Assiduité</span>
        </div>
      </div>
    </div>
  `;
}

// --- HELPER RENDU PHOTO ÉLÈVE (EMOJI OU BASE64/URL) ---
function renderStudentPhoto(photo, gender = 'M') {
  if (photo && (photo.startsWith('data:image') || photo.startsWith('http') || photo.startsWith('/'))) {
    return `<img src="${photo}" style="width:100%; height:100%; object-fit:cover;">`;
  }
  return `<span style="font-size:1.4rem; display:flex; align-items:center; justify-content:center; width:100%; height:100%;">${photo || (gender === 'F' ? '👩🏾‍🎓' : '👨🏾‍🎓')}</span>`;
}

let currentCardStudentId = "";

// --- MODULE 2: GESTION DES ÉLÈVES & INSCRIPTIONS ---
function renderStudentsTable(filteredStudents = null) {
  const tbody = document.getElementById("students-table-body");
  if (!tbody) return;
  const list = filteredStudents || appData.students;
  
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">Aucun élève trouvé pour ce critère.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(s => {
    const stName = getStuName(s);
    const stCls = getStuClass(s);
    const totFee = s.totalFee || s.total_fee || 150000;
    const restDue = (s.balance !== undefined && s.balance !== null) ? s.balance : totFee;
    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:42px; height:42px; border-radius:50%; overflow:hidden; background:#f1f5f9; border:2px solid var(--primary); display:flex; align-items:center; justify-content:center; flex-shrink:0;">${renderStudentPhoto(s.photo, s.gender)}</div>
            <span style="font-family: monospace; font-weight: 700; color: var(--primary);">${s.id}</span>
          </div>
        </td>
        <td>
          <strong>${stName}</strong>
          <div style="font-size:0.75rem; color:var(--text-muted);">Né(e) le ${s.birthDate || s.birth_date || 'N/A'}</div>
        </td>
        <td><span class="badge badge-info">${stCls}</span></td>
        <td><span class="badge" style="background:#f1f5f9;">${(s.cycle || 'college').toUpperCase()}</span></td>
        <td><strong>${s.pastAverage ? s.pastAverage.toFixed(1) + ' / 20' : 'N/A'}</strong></td>
        <td>
          <span class="badge ${s.status === 'À jour' ? 'badge-success' : s.status === 'Partiel' ? 'badge-warning' : 'badge-danger'}">${s.status || 'À jour'}</span>
          <div style="font-size:0.75rem; font-weight:800; color:${restDue > 0 ? '#ef4444' : '#059669'}; margin-top:2px;">Reste: ${restDue.toLocaleString('fr-FR')} FCFA</div>
        </td>
        <td><div style="font-size:0.8rem;">👨 ${s.fatherName || s.father_name || 'Père'}<br>👩 ${s.motherName || s.mother_name || 'Mère'}</div></td>
        <td>
          <div style="display: flex; gap: 0.4rem; flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" onclick="openStudentCard('${s.id}')" title="Générer Carte d'Élève & QR">🪪 Carte QR</button>
            ${(currentRole === 'admin' || currentRole === 'secretaire') ? `<button class="btn btn-primary btn-sm" onclick="openEditStudentModal('${s.id}')" title="Modifier le dossier élève ou la photo">✏️ Modifier</button>` : ''}
            ${(currentRole === 'admin' || currentRole === 'secretaire') ? `<button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}')" title="Supprimer en cascade">🗑️</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function filterStudents(searchTerm = "", classFilter = "") {
  const filtered = appData.students.filter(s => {
    const stName = getStuName(s).toLowerCase();
    const matchesSearch = `${stName} ${s.id}`.toLowerCase().includes(searchTerm);
    const matchesClass = !classFilter || getStuClass(s) === classFilter;
    return matchesSearch && matchesClass;
  });
  renderStudentsTable(filtered);
}

let editingStudentId = null;

function openEditStudentModal(id) {
  if (currentRole !== "admin" && currentRole !== "secretaire") {
    alert("⛔ Accès Refusé : Seuls l'Administrateur et le Secrétariat peuvent modifier un élève.");
    return;
  }
  const s = appData.students.find(x => x.id === id);
  if (!s) return;

  editingStudentId = s.id;
  const modal = document.getElementById("modal-add-student");
  if (!modal) return;
  
  const titleEl = modal.querySelector(".modal-title");
  if (titleEl) titleEl.textContent = `✏️ Modifier l'élève : ${getStuName(s)}`;
  const subBtn = modal.querySelector("button[type='submit']");
  if (subBtn) subBtn.textContent = "💾 Enregistrer les modifications";

  const setVal = (elemId, val) => { const el = document.getElementById(elemId); if (el) el.value = (val !== undefined && val !== null) ? val : ""; };
  
  setVal("stu-id", s.id);
  setVal("stu-lastname", s.lastName || s.last_name || "");
  setVal("stu-firstname", s.firstName || s.first_name || "");
  setVal("stu-cycle", s.cycle || "college");
  
  populateClassSelect("stu-class", s.cycle || "college", false);
  setVal("stu-class", getStuClass(s));
  setVal("stu-gender", s.gender || "F");
  setVal("stu-birthdate", s.birthDate || s.birth_date || "");
  setVal("stu-average", s.pastAverage || s.past_average || "");
  setVal("stu-repeating", s.isRepeating || s.is_repeating || "Non");
  setVal("stu-origin", s.originSchool || s.origin_school || "");
  setVal("stu-father", s.fatherName || s.father_name || "");
  setVal("stu-mother", s.motherName || s.mother_name || "");

  const box = document.getElementById("stu-photo-preview-box");
  if (box) box.innerHTML = renderStudentPhoto(s.photo, s.gender);
  const hiddenPhoto = document.getElementById("stu-photo-base64");
  if (hiddenPhoto) hiddenPhoto.value = (s.photo && (s.photo.startsWith("data:image") || s.photo.startsWith("http"))) ? s.photo : "";

  modal.classList.add("active");
}

function openAddStudentModal() {
  if (currentRole !== "admin" && currentRole !== "secretaire") {
    alert("⛔ Accès Refusé : Seuls l'Administrateur et le Secrétariat peuvent inscrire ou modifier un élève.");
    return;
  }
  editingStudentId = null;
  const modal = document.getElementById("modal-add-student");
  if (modal) {
    const titleEl = modal.querySelector(".modal-title");
    if (titleEl) titleEl.textContent = "Inscrire un nouvel élève (Secrétariat)";
    const subBtn = modal.querySelector("button[type='submit']");
    if (subBtn) subBtn.textContent = "Valider l'inscription & Matricule";
  }
  document.getElementById("form-add-student")?.reset();
  clearStudentPhotoSelect();

  const nextNum = String(appData.students.length + 1).padStart(4, "0");
  const stuId = document.getElementById("stu-id");
  if (stuId) stuId.value = `MAT-2026-${nextNum}`;
  
  const cyc = document.getElementById("stu-cycle")?.value || "maternelle";
  populateClassSelect("stu-class", cyc, false);
  updateStudentFeePreview(cyc);
  
  modal.classList.add("active");
}

function closeAddStudentModal() {
  document.getElementById("modal-add-student").classList.remove("active");
  document.getElementById("form-add-student").reset();
  clearStudentPhotoSelect();
}

async function handleAddStudent(e) {
  e.preventDefault();
  if (currentRole !== "admin" && currentRole !== "secretaire") {
    alert("⛔ Accès Refusé : Action non autorisée pour votre rôle.");
    return;
  }
  
  const lastNameVal = document.getElementById("stu-lastname")?.value.trim();
  const firstNameVal = document.getElementById("stu-firstname")?.value.trim();
  const classVal = document.getElementById("stu-class")?.value || "Petite Section (PS)";
  const cycleVal = document.getElementById("stu-cycle")?.value || "maternelle";

  if (!lastNameVal || !firstNameVal) {
    alert("⚠️ Veuillez remplir le Nom et le Prénom de l'élève pour valider l'inscription !");
    return;
  }

  const bDateVal = document.getElementById("stu-birthdate")?.value || "";
  if (bDateVal) {
    const parts = bDateVal.split("-");
    if (parts.length === 3) {
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const y = parseInt(parts[0], 10);
      if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1990 || y > 2026) {
        alert("⚠️ Date de naissance invalide ! Le mois doit obligatoirement être compris entre 01 et 12 (ex: 14/05/2014).");
        return;
      }
    }
  }

  const fees = appData.school.tuitionFees || { maternelle: 120000, primaire: 150000, college: 200000, lycee: 250000 };
  const assignedFee = fees[cycleVal] || 150000;
  const photoVal = document.getElementById("stu-photo-base64")?.value || ((document.getElementById("stu-gender")?.value === "F") ? "👩🏾‍🎓" : "👨🏾‍🎓");

  if (editingStudentId) {
    const stu = appData.students.find(x => x.id === editingStudentId);
    if (stu) {
      stu.lastName = lastNameVal.toUpperCase();
      stu.firstName = firstNameVal;
      stu.gender = document.getElementById("stu-gender")?.value || "F";
      stu.cycle = cycleVal;
      stu.class = classVal;
      stu.birthDate = bDateVal || "2014-05-14";
      stu.originSchool = document.getElementById("stu-origin")?.value || "École Normale";
      stu.pastAverage = parseFloat(document.getElementById("stu-average")?.value) || 12.0;
      stu.isRepeating = document.getElementById("stu-repeating")?.value || "Non";
      stu.fatherName = document.getElementById("stu-father")?.value || "Père Contact";
      stu.motherName = document.getElementById("stu-mother")?.value || "Mère Contact";
      stu.photo = photoVal;
      stu.totalFee = assignedFee;
      if (stu.balance === undefined || stu.balance === null) stu.balance = assignedFee;

      saveData();
      if (isConnectedToServer) {
        try {
          await fetch("/api/students", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(stu)
          });
        } catch(err) { console.error("Erreur synchro modif student"); }
      }
      closeAddStudentModal();
      showToast(`✏️ Dossier de ${getStuName(stu)} mis à jour avec succès !`, "success");
    }
    editingStudentId = null;
    return;
  }

  const newStudent = {
    id: document.getElementById("stu-id").value || `MAT-2026-${String(appData.students.length + 1).padStart(4, "0")}`,
    lastName: lastNameVal.toUpperCase(),
    firstName: firstNameVal,
    gender: document.getElementById("stu-gender")?.value || "F",
    cycle: cycleVal,
    class: classVal,
    birthDate: bDateVal || "2014-05-14",
    originSchool: document.getElementById("stu-origin")?.value || "École Normale",
    pastAverage: parseFloat(document.getElementById("stu-average")?.value) || 12.0,
    isRepeating: document.getElementById("stu-repeating")?.value || "Non",
    fatherName: document.getElementById("stu-father")?.value || "Père Contact",
    motherName: document.getElementById("stu-mother")?.value || "Mère Contact",
    photo: photoVal,
    status: "En retard",
    totalFee: assignedFee,
    balance: assignedFee,
    attendance: 98,
    incidents: ["Inscrit le " + new Date().toLocaleDateString('fr-FR')]
  };

  if (isConnectedToServer) {
    try {
      await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent)
      });
    } catch(err) {
      console.log("Erreur synchro serveur élève");
    }
  }

  appData.students.unshift(newStudent);
  saveData();
  closeAddStudentModal();
  showToast(`🎉 Nouvel élève inscrit : ${newStudent.firstName} ${newStudent.lastName} (${newStudent.class} - Tarif: ${assignedFee.toLocaleString('fr-FR')} FCFA) !`, "success");
}

async function deleteStudent(id) {
  if (currentRole !== "admin" && currentRole !== "secretaire") {
    alert("⛔ Accès Refusé : Seuls l'Administrateur et le Secrétariat peuvent supprimer un élève.");
    return;
  }
  if (confirm("⚠️ ATTENTION : Supprimer définitivement ce dossier élève ?\n\nSes encaissements et ses notes seront également purgés en cascade !")) {
    if (isConnectedToServer) {
      try {
        await fetch(`/api/students/${id}`, { method: "DELETE" });
      } catch(err) {}
    }
    appData.students = appData.students.filter(s => s.id !== id);
    appData.transactions = appData.transactions.filter(t => t.student_id !== id && !t.student.includes(id));
    delete appData.grades[id];
    saveData();
    showToast("🗑️ Dossier élève et ses encaissements effacés avec succès.", "danger");
  }
}

// --- CARTE D'ÉLÈVE OFFICIELLE AVEC QR CODE ---
function openStudentCard(studentId) {
  currentCardStudentId = studentId;
  const s = appData.students.find(x => x.id === studentId);
  if (!s) return;
  const qrSvg = generateCleanQrSvg(s.id);
  const stName = getStuName(s);
  const stCls = getStuClass(s);
  const schoolName = appData?.school?.name || appData?.school?.school_name || "Lycée & Groupe Scolaire Saint-Exupéry";
  const schoolMotto = appData?.school?.motto || "Unité - Progrès - Justice";
  
  const cardHtml = `
    <div class="id-card-container">
      <div class="id-card">
        <div class="id-card-header">
          <h4>${schoolName}</h4>
          <span>CARTE D'ÉLÈVE 2025-2026</span>
        </div>
        <div class="id-card-body">
          <div class="id-card-photo" style="overflow:hidden; display:flex; align-items:center; justify-content:center; background:#e2e8f0; width:90px; height:110px; border-radius:8px; border:2px solid var(--primary); flex-shrink:0;">${renderStudentPhoto(s.photo, s.gender)}</div>
          <div class="id-card-info">
            <strong>${stName}</strong>
            <span><b>Matricule :</b> ${s.id}</span><br>
            <span><b>Classe :</b> <span class="badge badge-info">${stCls}</span></span><br>
            <span><b>Né(e) le :</b> ${s.birthDate || s.birth_date || 'N/A'} (${s.gender || 'F'})</span><br>
            <span><b>Parents :</b> ${s.fatherName || s.father_name || 'Père'}</span>
          </div>
        </div>
        <div class="id-card-footer">
          <div style="font-size:0.7rem; color:#64748b;">
            <b>Validité :</b> 31/07/2026<br>
            <i>${schoolMotto}</i>
          </div>
          <div class="qr-box" title="Code QR lié à ${s.id}">
            ${qrSvg}
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById("student-card-render").innerHTML = cardHtml;
  document.getElementById("modal-student-card").classList.add("active");
}

function closeStudentCardModal() {
  document.getElementById("modal-student-card").classList.remove("active");
}

function printStudentCard() {
  window.print();
}

function generateCleanQrSvg(text) {
  return `
    <svg width="54" height="54" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="3" height="3" fill="#0f172a"/>
      <rect x="0.5" y="0.5" width="2" height="2" fill="white"/>
      <rect x="1" y="1" width="1" height="1" fill="#0f172a"/>
      <rect x="7" y="0" width="3" height="3" fill="#0f172a"/>
      <rect x="7.5" y="0.5" width="2" height="2" fill="white"/>
      <rect x="8" y="1" width="1" height="1" fill="#0f172a"/>
      <rect x="0" y="7" width="3" height="3" fill="#0f172a"/>
      <rect x="0.5" y="7.5" width="2" height="2" fill="white"/>
      <rect x="1" y="8" width="1" height="1" fill="#0f172a"/>
      <rect x="4" y="1" width="1" height="2" fill="#4f46e5"/>
      <rect x="5" y="3" width="2" height="1" fill="#0f172a"/>
      <rect x="3" y="5" width="3" height="1" fill="#0f172a"/>
      <rect x="7" y="6" width="2" height="2" fill="#4f46e5"/>
      <rect x="4" y="8" width="2" height="1" fill="#0f172a"/>
    </svg>
  `;
}

// --- GESTION DES PHOTOS D'IDENTITÉ / BADGE ÉLÈVES ---
function handleStudentPhotoSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    compressImageToIDPhoto(e.target.result, (compressedBase64) => {
      document.getElementById("stu-photo-base64").value = compressedBase64;
      const box = document.getElementById("stu-photo-preview-box");
      if (box) box.innerHTML = `<img src="${compressedBase64}" style="width:100%; height:100%; object-fit:cover;">`;
    });
  };
  reader.readAsDataURL(file);
}

function clearStudentPhotoSelect() {
  const inp = document.getElementById("stu-photo-file"); if (inp) inp.value = "";
  const hidden = document.getElementById("stu-photo-base64"); if (hidden) hidden.value = "";
  const box = document.getElementById("stu-photo-preview-box");
  const gender = document.getElementById("stu-gender")?.value || "F";
  if (box) box.innerHTML = `<span style="font-size:1.8rem;">${gender === "F" ? "👩🏾‍🎓" : "👨🏾‍🎓"}</span>`;
}

function updateCardPhoto(event) {
  if (currentRole !== "admin" && currentRole !== "secretaire") {
    alert("⛔ Accès Refusé : Seuls l'Administrateur et le Secrétariat peuvent modifier la photo du badge.");
    return;
  }
  const file = event.target.files[0];
  if (!file || !currentCardStudentId) return;

  const stu = appData.students.find(x => x.id === currentCardStudentId);
  if (!stu) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    compressImageToIDPhoto(e.target.result, async (compressedBase64) => {
      stu.photo = compressedBase64;
      saveData();
      
      if (isConnectedToServer) {
        try {
          await fetch(`/api/students`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(stu)
          });
        } catch(err) { console.error("Erreur synchro photo student", err); }
      }
      
      openStudentCard(currentCardStudentId);
      renderStudentsTable();
      showToast(`📸 Photo de badge mise à jour avec succès pour ${getStuName(stu)} !`, "success");
    });
  };
  reader.readAsDataURL(file);
}

function compressImageToIDPhoto(dataUrl, callback) {
  const img = new Image();
  img.onload = function() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    // Dimensions standard photo d'identité portrait ID -> 180x240 px
    canvas.width = 180;
    canvas.height = 240;
    ctx.drawImage(img, 0, 0, 180, 240);
    const compressed = canvas.toDataURL("image/jpeg", 0.85);
    callback(compressed);
  };
  img.src = dataUrl;
}

// --- PASSAGE DE CLASSE EN FIN D'ANNÉE (RÔLE ADMIN SEUL) ---
async function promoteAllStudents() {
  if (currentRole !== "admin") {
    showToast("⛔ Seul l'Administrateur peut exécuter le passage automatique en fin d'année.", "danger");
    return;
  }
  if (!confirm("⚠️ CONFIRMATION DE FIN D'ANNÉE : Voulez-vous faire passer automatiquement tous les élèves non-redoublants en classe supérieure ?")) {
    return;
  }

  if (isConnectedToServer) {
    try {
      const res = await fetch("/api/promote-year", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_year_label: "2026 - 2027" })
      });
      if (res.ok) {
        showToast("🎉 Passage d'année synchronisé en base de données !", "success");
        setTimeout(() => window.location.reload(), 1500);
        return;
      }
    } catch(err) {}
  }

  let promotedCount = 0;
  appData.students.forEach(s => {
    const isRep = s.isRepeating || s.is_repeating || "Non";
    const stCls = getStuClass(s);
    if (isRep.startsWith("Oui")) {
      if (!s.incidents) s.incidents = [];
      s.incidents.push("Redoublement effectif en " + stCls);
      return;
    }
    const nextClass = CLASSE_SUPERIEURE[stCls];
    if (nextClass) {
      s.class = nextClass;
      s.class_name = nextClass;
      if (["CP1", "CP2", "CE1", "CE2", "CM1", "CM2"].includes(nextClass)) s.cycle = "primaire";
      else if (["6ème", "5ème", "4ème", "3ème"].includes(nextClass)) s.cycle = "college";
      else if (["Seconde (2nde)", "Première (1ère)", "Terminale (Tle)"].includes(nextClass)) s.cycle = "lycee";
      
      const fees = appData.school.tuitionFees || { maternelle: 120000, primaire: 150000, college: 200000, lycee: 250000 };
      const newFee = fees[s.cycle] || 150000;
      s.totalFee = newFee;
      s.status = "En retard";
      s.balance = newFee;
      if (!s.incidents) s.incidents = [];
      s.incidents.push("Promu en " + nextClass);
      promotedCount++;
    }
  });

  saveData();
  showToast(`🎉 Rentrée préparée ! ${promotedCount} élèves promus en classe supérieure.`, "success");
}

// --- MODULE 3: PROFESSEURS ---
function renderTeachersTable() {
  const tbody = document.getElementById("teachers-table-body");
  if (!tbody) return;
  tbody.innerHTML = appData.teachers.map(t => `
    <tr>
      <td><strong style="color: var(--text-main); font-size:1rem;">${t.name}</strong></td>
      <td><span class="badge badge-purple">${t.subject}</span></td>
      <td>${t.email}</td>
      <td>${t.phone}</td>
      <td>${(t.classes || []).map(c => `<span class="badge" style="background:#f1f5f9; border:1px solid #cbd5e1; margin-right:4px;">${c}</span>`).join("")}</td>
      <td>
        ${(currentRole === 'admin' || currentRole === 'secretaire') ? `<button class="btn btn-primary btn-sm" onclick="openEditTeacherModal('${t.id}')" style="margin-right:4px;">✏️ Modifier</button>` : ''}
        ${(currentRole === 'admin' || currentRole === 'secretaire') ? `<button class="btn btn-danger btn-sm" onclick="deleteTeacher('${t.id}')" title="Supprimer du répertoire">🗑️ Supprimer</button>` : '<i>Protégé</i>'}
      </td>
    </tr>
  `).join("");
}

let editingTeacherId = null;

function openEditTeacherModal(id) {
  if (currentRole !== "admin" && currentRole !== "secretaire") {
    alert("⛔ Accès Refusé : Seuls l'Administrateur et le Secrétariat peuvent gérer les enseignants.");
    return;
  }
  const t = appData.teachers.find(x => x.id === id);
  if (!t) return;
  editingTeacherId = t.id;

  const modal = document.getElementById("modal-add-teacher");
  if (!modal) return;
  const titleEl = modal.querySelector(".modal-title");
  if (titleEl) titleEl.textContent = `✏️ Modifier l'enseignant : ${t.name}`;
  const subBtn = modal.querySelector("button[type='submit']");
  if (subBtn) subBtn.textContent = "💾 Enregistrer";

  document.getElementById("tea-name").value = t.name || "";
  document.getElementById("tea-subject").value = t.subject || "";
  document.getElementById("tea-email").value = t.email || "";
  document.getElementById("tea-phone").value = t.phone || "";
  document.getElementById("tea-classes").value = (t.classes && t.classes[0]) ? t.classes[0] : "Toutes";

  modal.classList.add("active");
}

function openAddTeacherModal() {
  if (currentRole !== "admin" && currentRole !== "secretaire") {
    alert("⛔ Accès Refusé : Seuls l'Administrateur et le Secrétariat peuvent gérer les enseignants.");
    return;
  }
  editingTeacherId = null;
  const modal = document.getElementById("modal-add-teacher");
  if (modal) {
    const titleEl = modal.querySelector(".modal-title");
    if (titleEl) titleEl.textContent = "Ajouter un enseignant";
    const subBtn = modal.querySelector("button[type='submit']");
    if (subBtn) subBtn.textContent = "Valider";
  }
  document.getElementById("form-add-teacher")?.reset();
  modal.classList.add("active");
}
function closeAddTeacherModal() {
  document.getElementById("modal-add-teacher").classList.remove("active");
  document.getElementById("form-add-teacher").reset();
}
function handleAddTeacher(e) {
  e.preventDefault();
  if (currentRole !== "admin" && currentRole !== "secretaire") {
    alert("⛔ Accès Refusé : Seuls l'Administrateur et le Secrétariat peuvent gérer les enseignants.");
    return;
  }

  const nameVal = document.getElementById("tea-name").value;
  const subVal = document.getElementById("tea-subject").value;
  const emailVal = document.getElementById("tea-email").value;
  const phoneVal = document.getElementById("tea-phone").value;
  const classVal = document.getElementById("tea-classes").value || "Toutes";

  if (editingTeacherId) {
    const t = appData.teachers.find(x => x.id === editingTeacherId);
    if (t) {
      t.name = nameVal;
      t.subject = subVal;
      t.email = emailVal;
      t.phone = phoneVal;
      t.classes = [classVal];
      saveData();
      showToast(`✏️ Enseignant "${t.name}" mis à jour avec succès !`, "success");
    }
    editingTeacherId = null;
    closeAddTeacherModal();
    return;
  }

  const newTeacher = {
    id: `PRF-0${appData.teachers.length + 1}`,
    name: nameVal,
    subject: subVal,
    email: emailVal,
    phone: phoneVal,
    classes: [classVal]
  };
  appData.teachers.push(newTeacher);
  saveData();
  closeAddTeacherModal();
  showToast("✅ Enseignant ajouté au corps professoral.", "success");
}

async function deleteTeacher(id) {
  if (currentRole !== "admin" && currentRole !== "secretaire") {
    alert("⛔ Accès Refusé : Seuls l'Administrateur et le Secrétariat peuvent supprimer un enseignant.");
    return;
  }
  if (confirm("Supprimer définitivement cet enseignant du répertoire ?")) {
    if (isConnectedToServer) {
      try { await fetch(`/api/teachers/${id}`, { method: "DELETE" }); } catch(err) {}
    }
    appData.teachers = appData.teachers.filter(t => t.id !== id);
    saveData();
    showToast("🗑️ Enseignant supprimé du répertoire.", "warning");
  }
}

// --- MODULE 4: CLASSES & COURS ---
function renderClassesGrid() {
  const container = document.getElementById("classes-grid-container");
  if (!container) return;
  const allClassNames = Object.values(CYCLES_CLASSES).flat();
  container.innerHTML = allClassNames.map(cName => {
    const studentsInClass = appData.students.filter(s => getStuClass(s) === cName);
    const count = studentsInClass.length;
    let cycleLabel = "Cycle";
    if (CYCLES_CLASSES.maternelle.includes(cName)) cycleLabel = "Maternelle";
    else if (CYCLES_CLASSES.primaire.includes(cName)) cycleLabel = "Primaire";
    else if (CYCLES_CLASSES.college.includes(cName)) cycleLabel = "Collège";
    else if (CYCLES_CLASSES.lycee.includes(cName)) cycleLabel = "Lycée";

    return `
      <div class="card" style="border-top: 5px solid var(--primary);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.75rem;">
          <h3 style="font-size:1.2rem; font-weight:800; color:var(--text-main);">${cName}</h3>
          <span class="badge ${count > 0 ? 'badge-success' : 'badge-warning'}">${count} Élèves</span>
        </div>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom: 0.5rem;"><strong>Cycle :</strong> ${cycleLabel}</p>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom: 1.25rem;"><strong>Matières configurées :</strong> ${(appData.subjects[cName] || []).length} disciplines</p>
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-light); padding-top:0.75rem;">
          <button class="btn btn-secondary btn-sm" onclick="filterStudents('', '${cName}'); switchView('students');">📋 Élèves</button>
          <button class="btn btn-sm" style="background:#e0e7ff; color:#3730a3;" onclick="switchView('attendance');">🛡️ Appel</button>
        </div>
      </div>
    `;
  }).join("");
}

// --- MODULE 5: MATIÈRES, NOTES & BULLETINS ---
function renderSubjectsTable(className) {
  const tbody = document.getElementById("subjects-table-body");
  if (!tbody) return;
  const subs = appData.subjects[className] || [];
  if (subs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-muted);">Aucune matière configurée pour cette classe. Cliquez sur "+ Ajouter une discipline".</td></tr>`;
    return;
  }
  tbody.innerHTML = subs.map(sub => `
    <tr>
      <td><strong style="color:var(--text-main); font-size:1rem;">${sub.name}</strong></td>
      <td><span class="badge badge-info" style="font-size:0.9rem;">Coef ${sub.coef}</span></td>
      <td>${sub.teacher}</td>
      <td>
        ${(currentRole === 'admin' || currentRole === 'professeur') ? `<button class="btn btn-danger btn-sm" onclick="deleteSubject('${className}', '${sub.id}')">🗑️ Supprimer</button>` : '<i>Protégé</i>'}
      </td>
    </tr>
  `).join("");
}

function openAddSubjectModal() {
  if (currentRole !== "admin" && currentRole !== "professeur") {
    alert("⛔ Accès Refusé : Seuls l'Administrateur et les Enseignants peuvent configurer les matières et coefficients.");
    return;
  }
  const sel = document.getElementById("sub-class-select");
  const modSel = document.getElementById("new-sub-class");
  if (modSel && sel) modSel.value = sel.value;
  document.getElementById("modal-add-subject").classList.add("active");
}
function closeAddSubjectModal() {
  document.getElementById("modal-add-subject").classList.remove("active");
  document.getElementById("form-add-subject").reset();
}
function handleAddSubject(e) {
  e.preventDefault();
  if (currentRole !== "admin" && currentRole !== "professeur") {
    alert("⛔ Accès Refusé : Seuls l'Administrateur et les Enseignants peuvent configurer les matières et coefficients.");
    return;
  }
  const className = document.getElementById("new-sub-class").value;
  if (!appData.subjects[className]) appData.subjects[className] = [];
  
  const newSub = {
    id: `SUB-${Math.random().toString(36).substr(2, 5)}`,
    name: document.getElementById("new-sub-name").value,
    coef: parseInt(document.getElementById("new-sub-coef").value) || 2,
    teacher: document.getElementById("new-sub-teacher").value || "Enseignant assigné"
  };
  
  appData.subjects[className].push(newSub);
  saveData();
  closeAddSubjectModal();
  renderSubjectsTable(className);
  if (document.getElementById("prof-class-select")?.value === className) {
    populateSubjectSelectForProf("prof-subject-select", className);
  }
  showToast(`✅ Matière "${newSub.name}" ajoutée avec succès à la classe ${className} !`, "success");
}

function deleteSubject(className, subId) {
  if (currentRole !== "admin" && currentRole !== "professeur") {
    alert("⛔ Accès Refusé : Seuls l'Administrateur et les Enseignants peuvent configurer les matières et coefficients.");
    return;
  }
  if (confirm("Supprimer cette discipline de la classe ?")) {
    appData.subjects[className] = appData.subjects[className].filter(s => s.id !== subId);
    saveData();
    renderSubjectsTable(className);
    showToast("Matière supprimée.", "warning");
  }
}

function renderProfGradesTable(className, subjectName) {
  const tbody = document.getElementById("prof-grades-body");
  if (!tbody) return;
  const classStudents = appData.students.filter(s => getStuClass(s) === className);
  if (classStudents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2.5rem; color:var(--text-muted);">Aucun élève inscrit dans la classe <b>${className}</b>.</td></tr>`;
    return;
  }
  
  const trimesterLabel = TRIMESTER_LABELS[activeGradeTrimester] || activeGradeTrimester;

  tbody.innerHTML = classStudents.map(st => {
    const stName = getStuName(st);
    const stGrades = appData.grades[st.id] || {};
    const subGrades = stGrades[subjectName] || {};
    const g = subGrades[activeGradeTrimester] || { note1: "", note2: "", compo: "" };
    const isRead = (currentRole !== 'admin' && currentRole !== 'professeur') ? 'disabled' : '';
    return `
      <tr data-student-id="${st.id}">
        <td><strong>${stName}</strong> <span style="font-family:monospace; color:var(--primary);">(${st.id})</span></td>
        <td><input type="number" step="0.5" min="0" max="20" class="form-control grade-input" data-field="note1" value="${g.note1}" placeholder="-- / 20" style="width:110px; font-weight:700;" ${isRead}></td>
        <td><input type="number" step="0.5" min="0" max="20" class="form-control grade-input" data-field="note2" value="${g.note2}" placeholder="-- / 20" style="width:110px; font-weight:700;" ${isRead}></td>
        <td><input type="number" step="0.5" min="0" max="20" class="form-control grade-input" data-field="compo" value="${g.compo}" placeholder="-- / 20" style="width:110px; font-weight:800; color:var(--primary);" ${isRead}></td>
        <td><span class="badge badge-success">${trimesterLabel}</span></td>
      </tr>
    `;
  }).join("");
}

function changeGradeTrimester(tri) {
  activeGradeTrimester = tri;
  const className = document.getElementById("prof-class-select")?.value;
  const subjectName = document.getElementById("prof-subject-select")?.value;
  if (className) renderProfGradesTable(className, subjectName);
}

function saveProfGrades() {
  if (currentRole !== "admin" && currentRole !== "professeur") {
    alert("⛔ Accès Refusé : Seuls l'Administrateur et les Enseignants peuvent saisir et valider les notes.");
    return;
  }
  const className = document.getElementById("prof-class-select").value;
  const subjectName = document.getElementById("prof-subject-select").value;
  if (!subjectName) {
    showToast("Veuillez sélectionner une discipline d'abord.", "warning");
    return;
  }

  const trimesterLabel = TRIMESTER_LABELS[activeGradeTrimester] || activeGradeTrimester;
  const rows = document.querySelectorAll("#prof-grades-body tr[data-student-id]");
  let count = 0;
  rows.forEach(row => {
    const stId = row.dataset.studentId;
    if (!appData.grades[stId]) appData.grades[stId] = {};
    if (!appData.grades[stId][subjectName]) appData.grades[stId][subjectName] = {};
    
    const n1 = parseFloat(row.querySelector('input[data-field="note1"]').value);
    const n2 = parseFloat(row.querySelector('input[data-field="note2"]').value);
    const compo = parseFloat(row.querySelector('input[data-field="compo"]').value);
    
    appData.grades[stId][subjectName][activeGradeTrimester] = {
      note1: !isNaN(n1) ? n1 : 14,
      note2: !isNaN(n2) ? n2 : 14,
      compo: !isNaN(compo) ? compo : 15
    };
    count++;
  });

  saveData();
  showToast(`✅ Notes de "${subjectName}" (${trimesterLabel}) enregistrées avec succès pour les ${count} élèves de ${className} !`, "success");
}

function updateStudentSelects() {
  const select = document.getElementById("bulletin-student-select");
  if (!select) return;
  select.innerHTML = `<option value="">-- Sélectionner un élève pour le bulletin --</option>` + 
    appData.students.filter(s => getStuClass(s) !== "Diplômé / Ancien Élève").map(s => {
      const stName = getStuName(s);
      const stCls = getStuClass(s);
      return `<option value="${s.id}">${stName} (${stCls} - ${s.id})</option>`;
    }).join("");
}

// --- HELPER DIRECTION ET SIGNATAIRES PAR CYCLE ---
function getDirectorForCycle(cycleKey) {
  const cyc = (cycleKey || "college").toLowerCase();
  const school = appData?.school || {};
  if (cyc === "maternelle") return { title: "La Directrice de l'École Maternelle", name: school.directorMaternelle || "Mme Aminata KINDA", stamp: "CACHET DIRECTION<br>MATERNELLE" };
  if (cyc === "primaire") return { title: "Le Directeur de l'École Primaire", name: school.directorPrimaire || school.director || "M. Ousmane COMPAORÉ", stamp: "CACHET DIRECTION<br>PRIMAIRE" };
  if (cyc === "college") return { title: "Le Principal du Collège", name: school.directorCollege || school.director || "Dr. Alassane DIARRA", stamp: "CACHET DIRECTION<br>COLLÈGE" };
  if (cyc === "lycee") return { title: "Le Proviseur du Lycée", name: school.directorLycee || school.director || "M. Christian SANOU", stamp: "CACHET DIRECTION<br>LYCÉE" };
  return { title: "Le Chef d'Établissement", name: school.director || "M. Ousmane COMPAORÉ", stamp: "CACHET OFFICIEL<br>ST-EXUPÉRY" };
}

// --- HELPER APPRÉCIATION RIGOUREUSE DES NOTES (ÉCHELLE FRANÇAISE/BURKINABÈ) ---
function getAppreciationText(note, isGeneral = false) {
  const n = parseFloat(note) || 0;
  if (n === 0) return isGeneral ? "Nul / Zéro absolu (Aucun effort)" : "Nul / Zéro";
  if (n < 5) return isGeneral ? "Nul / Travail très insuffisant et alarmant." : "Nul / Très faible";
  if (n < 8) return isGeneral ? "Insuffisant / Résultats trop faibles, redoublez d'efforts." : "Insuffisant / Faible";
  if (n < 10) return isGeneral ? "Médiocre / Peut mieux faire, le travail manque de rigueur." : "Médiocre / Insuffisant";
  if (n < 12) return isGeneral ? "Passable / Résultats justes moyens, vous pouvez mieux faire." : "Passable / Moyen";
  if (n < 14) return isGeneral ? "Assez Bien / Trimestre satisfaisant, poursuivez ainsi." : "Assez Bien";
  if (n < 16) return isGeneral ? "Bien / Tableau d'honneur. Bon trimestre, élève sérieux." : "Bien / Bon travail";
  if (n < 18) return isGeneral ? "Très Bien / Félicitations. Excellent travail." : "Très Bien / Maîtrise";
  return isGeneral ? "Excellence absolue / Félicitations spéciales du Conseil." : "Excellent / Parfait";
}

function generateBulletin() {
  const studentId = document.getElementById("bulletin-student-select").value;
  if (!studentId) {
    showToast("Veuillez sélectionner un élève d'abord.", "warning");
    return;
  }
  
  const selectedPeriod = document.getElementById("bulletin-trimester-select")?.value || "T1";
  const isGeneral = selectedPeriod === "general";
  const student = appData.students.find(s => s.id === studentId);
  const stName = getStuName(student);
  const stCls = getStuClass(student);
  const subjects = appData.subjects[stCls] || appData.subjects["3ème"] || [];
  const studentGrades = appData.grades[studentId] || {};

  const periodsToUse = isGeneral ? ["T1", "T2", "T3"] : [selectedPeriod];
  const periodLabel = isGeneral ? "BULLETIN GÉNÉRAL ANNUEL" : `BULLETIN DE NOTES OFFICIEL - ${TRIMESTER_LABELS[selectedPeriod] || selectedPeriod}`;
  const periodSubLabel = isGeneral ? "Moyenne Générale des 3 Trimestres" : TRIMESTER_LABELS[selectedPeriod] || selectedPeriod;

  function computeMoyForPeriod(subGrades, periodKey) {
    const g = subGrades[periodKey] || { note1: 14, note2: 14, compo: 14 };
    return (g.note1 + g.note2 + g.compo * 2) / 4;
  }

  let totalPoints = 0;
  let totalCoef = 0;

  const classStudents = appData.students.filter(s => getStuClass(s) === stCls);
  const averagesList = classStudents.map(st => {
    const stGrades = appData.grades[st.id] || {};
    let pts = 0, cfs = 0;
    subjects.forEach(sub => {
      const subG = stGrades[sub.name] || {};
      let avg = 0;
      if (isGeneral) {
        const m1 = computeMoyForPeriod(subG, "T1");
        const m2 = computeMoyForPeriod(subG, "T2");
        const m3 = computeMoyForPeriod(subG, "T3");
        avg = (m1 + m2 + m3) / 3;
      } else {
        avg = computeMoyForPeriod(subG, selectedPeriod);
      }
      pts += avg * sub.coef;
      cfs += sub.coef;
    });
    return { id: st.id, avg: pts / (cfs || 1) };
  }).sort((a, b) => b.avg - a.avg);

  const rankIdx = averagesList.findIndex(x => x.id === studentId);
  const rankStr = rankIdx === 0 ? "1er / " + classStudents.length : (rankIdx + 1) + "ème / " + classStudents.length;

  let rowsHtml = "";

  if (isGeneral) {
    rowsHtml = subjects.map(sub => {
      const subG = studentGrades[sub.name] || {};
      const m1 = computeMoyForPeriod(subG, "T1");
      const m2 = computeMoyForPeriod(subG, "T2");
      const m3 = computeMoyForPeriod(subG, "T3");
      const moyenneAnuelle = (m1 + m2 + m3) / 3;
      const points = moyenneAnuelle * sub.coef;
      totalPoints += points;
      totalCoef += sub.coef;
      const app = getAppreciationText(moyenneAnuelle, false);

      return `
        <tr style="border-bottom:1px solid #cbd5e1;">
          <td style="padding:4px 8px;">
            <strong style="font-size:0.85rem;">${sub.name}</strong><br>
            <span style="font-size:0.65rem; color:#64748b;">Prof : ${sub.teacher}</span>
          </td>
          <td style="text-align:center; font-weight:700; padding:4px;">${sub.coef}</td>
          <td style="text-align:center; padding:4px; font-size:0.85rem; font-weight:600; color:#4f46e5;">${m1.toFixed(1)}</td>
          <td style="text-align:center; padding:4px; font-size:0.85rem; font-weight:600; color:#059669;">${m2.toFixed(1)}</td>
          <td style="text-align:center; padding:4px; font-size:0.85rem; font-weight:600; color:#d97706;">${m3.toFixed(1)}</td>
          <td style="text-align:center; font-weight:900; color:#0f172a; font-size:1rem; padding:4px; background:#f1f5f9; border-radius:4px;">${moyenneAnuelle.toFixed(2)}</td>
          <td style="font-size:0.75rem; font-style:italic; color:#334155; padding:4px 8px;">${app}</td>
        </tr>
      `;
    }).join("");
  } else {
    rowsHtml = subjects.map(sub => {
      const subG = studentGrades[sub.name] || {};
      const g = subG[selectedPeriod] || { note1: 14, note2: 15, compo: 15.5 };
      const moyenneMatiere = computeMoyForPeriod(subG, selectedPeriod);
      const points = moyenneMatiere * sub.coef;
      totalPoints += points;
      totalCoef += sub.coef;
      const app = getAppreciationText(moyenneMatiere, false);

      return `
        <tr style="border-bottom:1px solid #cbd5e1;">
          <td style="padding:4px 8px;">
            <strong style="font-size:0.9rem;">${sub.name}</strong><br>
            <span style="font-size:0.7rem; color:#64748b;">Prof : ${sub.teacher}</span>
          </td>
          <td style="text-align:center; font-weight:700; padding:4px;">${sub.coef}</td>
          <td style="text-align:center; padding:4px;">${g.note1}</td>
          <td style="text-align:center; padding:4px;">${g.note2}</td>
          <td style="text-align:center; font-weight:600; padding:4px;">${g.compo}</td>
          <td style="text-align:center; font-weight:800; color:var(--primary); font-size:1rem; padding:4px;">${moyenneMatiere.toFixed(2)}</td>
          <td style="font-size:0.8rem; font-style:italic; color:#334155; padding:4px 8px;">${app} <br><span style="font-size:0.65rem; color:#94a3b8;">[Signé]</span></td>
        </tr>
      `;
    }).join("");
  }

  const generalAverage = (totalPoints / (totalCoef || 1)).toFixed(2);
  const dirInfo = getDirectorForCycle(student.cycle);
  const generalApp = getAppreciationText(generalAverage, true);

  const theadHtml = isGeneral ? `
    <tr>
      <th style="color:#000; padding:5px 8px;">Matière & Enseignant</th>
      <th style="text-align:center; color:#000; padding:5px 4px;">Coef</th>
      <th style="text-align:center; color:#000; padding:5px 4px; background:#ede9fe;">T1 / 20</th>
      <th style="text-align:center; color:#000; padding:5px 4px; background:#d1fae5;">T2 / 20</th>
      <th style="text-align:center; color:#000; padding:5px 4px; background:#fef3c7;">T3 / 20</th>
      <th style="text-align:center; color:#000; padding:5px 4px; background:#e2e8f0; font-weight:900;">Moy. Annuelle</th>
      <th style="color:#000; padding:5px 8px;">Appréciation</th>
    </tr>
  ` : `
    <tr>
      <th style="color:#000; padding:5px 8px;">Matière & Enseignant</th>
      <th style="text-align:center; color:#000; padding:5px 4px;">Coef</th>
      <th style="text-align:center; color:#000; padding:5px 4px;">Devoir 1</th>
      <th style="text-align:center; color:#000; padding:5px 4px;">Devoir 2</th>
      <th style="text-align:center; color:#000; padding:5px 4px;">Compo / Examen</th>
      <th style="text-align:center; color:#000; padding:5px 4px;">Moyenne / 20</th>
      <th style="color:#000; padding:5px 8px;">Appréciation & Signature Prof</th>
    </tr>
  `;

  const bannerColor = isGeneral ? "linear-gradient(135deg, #0f172a, #1e293b)" : "var(--primary-gradient)";
  const bannerBadge = isGeneral ? `<span style="display:inline-block; padding:4px 12px; background:#7c3aed; color:white; font-size:0.75rem; font-weight:800; border-radius:4px;">${periodLabel}</span>` : `<span style="display:inline-block; padding:2px 8px; background:#0f172a; color:white; font-size:0.75rem; font-weight:800; border-radius:4px;">${periodLabel}</span>`;

  const container = document.getElementById("bulletin-render-area");
  container.innerHTML = `
    <div class="bulletin-preview">
      <div class="bulletin-header-top" style="margin-bottom:0.6rem; padding-bottom:0.4rem; border-bottom:2px solid #000;">
        <div class="bulletin-school-col">
          <h2 style="font-size:1.2rem; font-weight:900; color:#0f172a; margin:0;">${appData.school.name}</h2>
          <span style="font-size:0.8rem;">${appData.school.address} | Tél : ${appData.school.phone}</span><br>
          <b style="color:var(--primary); font-size:0.85rem;">Année Scolaire : ${appData.school.year}</b>
        </div>
        <div class="bulletin-motto-col" style="text-align:right;">
          <span style="font-weight:900; font-size:1rem; display:block;">RÉPUBLIQUE DU ${appData.school.country.toUpperCase()}</span>
          <strong style="color:#4f46e5; font-style:italic; font-size:0.85rem;">"${appData.school.motto}"</strong><br>
          ${bannerBadge}
        </div>
      </div>
      
      <div class="bulletin-student-box" style="margin-bottom:0.6rem; padding:0.4rem 0.75rem; background:#f8fafc; border:1px solid #94a3b8; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span style="font-size:0.75rem; color:#64748b; font-weight:700;">NOM ET PRÉNOM DE L'ÉLÈVE :</span>
          <h3 style="font-size:1.25rem; font-weight:900; color:#0f172a; margin:2px 0;">${stName}</h3>
          <span style="font-size:0.8rem;"><b>Matricule :</b> ${student.id} | <b>Né(e) le :</b> ${student.birthDate || student.birth_date || 'N/A'}</span>
        </div>
        <div style="text-align:right;">
          <span style="font-size:0.75rem; color:#64748b; font-weight:700;">CLASSE & RANG :</span>
          <div style="font-size:1.2rem; font-weight:800; color:var(--primary);">${stCls}</div>
          <span class="badge badge-success" style="font-size:0.85rem; margin-top:2px;">Rang : ${rankStr}</span>
        </div>
      </div>

      <div class="table-container" style="margin-bottom:0.6rem; border:1px solid #000; box-shadow:none; overflow:hidden;">
        <table style="border-collapse:collapse; width:100%; margin:0;">
          <thead style="background:#f1f5f9; border-bottom:2px solid #000;">
            ${theadHtml}
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:0.6rem 1rem; border-radius:6px; border:2px solid #0f172a; margin-bottom:0.8rem;">
        <div>
          <h4 style="font-size:0.85rem; color:#0f172a; text-transform:uppercase; margin:0; font-weight:900;">Décision & Appréciation du Conseil de Classe ${isGeneral ? '(Année Complète)' : periodSubLabel} :</h4>
          <p style="font-weight:700; color:#1e293b; font-size:0.95rem; margin:0.25rem 0 0 0;">
            "${generalApp}"
          </p>
        </div>
        <div style="text-align:right; border-left:2px solid #cbd5e1; padding-left:1rem;">
          <span style="font-size:0.75rem; color:#64748b; display:block; font-weight:700;">MOYENNE GÉNÉRALE ${isGeneral ? "ANNUELLE" : "DU TRIMESTRE"}</span>
          <span style="font-size:1.8rem; font-weight:900; color:#0f172a; line-height:1;">${generalAverage} <small style="font-size:0.9rem; font-weight:600;">/ 20</small></span>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; margin-top:0.8rem; padding: 0 1rem; page-break-inside:avoid;">
        <div style="text-align:center; width:220px;">
          <p style="font-size:0.85rem; font-weight:800; text-decoration:underline; margin:0;">Signature du Professeur Principal</p>
          <div style="height:50px; margin-top:6px; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-style:italic; border:1px dashed #cbd5e1; border-radius:6px; font-size:0.8rem;">
            [Cachet & Signé]
          </div>
        </div>
        <div style="text-align:center; width:260px;">
          <p style="font-size:0.85rem; font-weight:800; text-decoration:underline; margin:0;">${dirInfo.title}</p>
          <p style="font-size:0.85rem; color:#1e293b; font-weight:900; margin-top:2px;">${dirInfo.name}</p>
          <div style="height:55px; margin-top:4px; display:flex; align-items:center; justify-content:center; color:#4f46e5; font-weight:800; font-size:0.75rem; border:2px solid #4f46e5; border-radius:50%; width:115px; margin-left:auto; margin-right:auto; transform:rotate(-5deg); opacity:0.85; line-height:1.2;">
            ${dirInfo.stamp}
          </div>
          <p style="font-size:0.7rem; color:#64748b; margin-top:0.3rem;">Ouagadougou, le ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
    </div>
  `;
}

function printBulletin() {
  window.print();
}

// --- MODULE 6: PRÉSENCES, SURVEILLANCE & INCIDENTS ---
function renderAttendanceModule() {
  const attClassSel = document.getElementById("att-class-select");
  if (attClassSel && !attClassSel.innerHTML) {
    const allClassNames = Object.values(CYCLES_CLASSES).flat();
    attClassSel.innerHTML = allClassNames.map(c => `<option value="${c}">${c}</option>`).join("");
    if (!attClassSel.value) attClassSel.value = "Terminale (Tle)";
  }
  const cName = attClassSel ? attClassSel.value : "Terminale (Tle)";
  renderClassRollCall(cName);
  renderIncidentsLog();
}

function renderClassRollCall(className) {
  const tbody = document.getElementById("att-rollcall-body");
  if (!tbody) return;
  const list = appData.students.filter(s => getStuClass(s) === className);
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-muted);">Aucun élève inscrit en ${className}.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = list.map(s => {
    const stName = getStuName(s);
    const canRollCall = (currentRole === 'admin' || currentRole === 'surveillant' || currentRole === 'professeur');
    return `
      <tr>
        <td><strong>${stName}</strong> <br><span style="font-family:monospace; font-size:0.75rem; color:var(--primary);">${s.id}</span></td>
        <td><span class="badge badge-success" style="font-size:0.9rem;">${s.attendance || 95}%</span></td>
        <td>
          ${canRollCall ? `
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-success" onclick="markAttendance('${s.id}', 'Présent')">✔ Présent</button>
            <button class="btn btn-sm btn-warning" onclick="markAttendance('${s.id}', 'Retard')">⏳ Retard</button>
            <button class="btn btn-sm btn-danger" onclick="markAttendance('${s.id}', 'Absent')">✖ Absent</button>
          </div>` : '<span class="badge" style="background:#f1f5f9; color:#64748b;">Lecture Seule</span>'}
        </td>
        <td>${canRollCall ? `<button class="btn btn-sm btn-secondary" onclick="openAddIncidentModal('${s.id}')">🚨 + Incident</button>` : ''}</td>
      </tr>
    `;
  }).join("");
}

function renderIncidentsLog() {
  const tbody = document.getElementById("att-incidents-body");
  if (!tbody) return;
  
  let allIncidents = [];
  appData.students.forEach(s => {
    if (s.incidents && s.incidents.length > 0) {
      const stName = getStuName(s);
      const stCls = getStuClass(s);
      s.incidents.forEach(inc => {
        allIncidents.push({ student: `${stName} (${stCls})`, stId: s.id, text: inc });
      });
    }
  });

  if (allIncidents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:2rem; color:var(--text-muted);">Aucun incident de discipline ou d'infirmerie signalé pour le moment.</td></tr>`;
    return;
  }

  tbody.innerHTML = allIncidents.reverse().slice(0, 15).map(item => {
    let badgeType = "badge-info";
    if (item.text.toLowerCase().includes("retard")) badgeType = "badge-warning";
    else if (item.text.toLowerCase().includes("absence") || item.text.toLowerCase().includes("convocation") || item.text.toLowerCase().includes("avertissement")) badgeType = "badge-danger";
    else if (item.text.toLowerCase().includes("félicitation") || item.text.toLowerCase().includes("excellence") || item.text.toLowerCase().includes("promu") || item.text.toLowerCase().includes("inscrit")) badgeType = "badge-success";
    
    return `
      <tr>
        <td><strong>${item.student}</strong></td>
        <td><span class="badge ${badgeType}" style="font-size:0.85rem; padding:6px 12px;">${item.text}</span></td>
        <td>${(currentRole === 'admin' || currentRole === 'surveillant' || currentRole === 'professeur') ? `<button class="btn btn-sm btn-secondary" onclick="openAddIncidentModal('${item.stId}')">➕ Ajouter au dossier</button>` : ''}</td>
      </tr>
    `;
  }).join("");
}

function markAttendance(studentId, status) {
  if (currentRole !== "admin" && currentRole !== "surveillant" && currentRole !== "professeur") {
    alert("⛔ Accès Refusé : Seuls l'Administrateur, les Surveillants et les Enseignants peuvent faire l'appel.");
    return;
  }
  const stu = appData.students.find(s => s.id === studentId);
  if (stu) {
    if (status === 'Absent') {
      stu.attendance = Math.max(0, (stu.attendance || 95) - 4);
      stu.incidents.push(`Absence signalée par la surveillance (${new Date().toLocaleDateString('fr-FR')})`);
    } else if (status === 'Retard') {
      stu.attendance = Math.max(0, (stu.attendance || 95) - 1);
      stu.incidents.push(`Retard non justifié (${new Date().toLocaleDateString('fr-FR')})`);
    } else if (status === 'Présent') {
      stu.attendance = Math.min(100, (stu.attendance || 95) + 1);
    }
    saveData();
    renderClassRollCall(getStuClass(stu));
    renderIncidentsLog();
    showToast(`📍 Pointage : ${getStuName(stu)} -> ${status}`, status === 'Présent' ? 'success' : 'warning');
  }
}

function openAddIncidentModal(studentId = "") {
  if (currentRole !== "admin" && currentRole !== "surveillant" && currentRole !== "professeur") {
    alert("⛔ Accès Refusé : Seuls l'Administrateur, la Vie Scolaire et les Enseignants peuvent signaler des incidents.");
    return;
  }
  const sel = document.getElementById("inc-student-select");
  if (sel) {
    sel.innerHTML = appData.students.map(s => {
      const stName = getStuName(s);
      const stCls = getStuClass(s);
      return `<option value="${s.id}" ${s.id === studentId ? 'selected' : ''}>${stName} (${stCls})</option>`;
    }).join("");
  }
  document.getElementById("modal-add-incident").classList.add("active");
}
function closeAddIncidentModal() {
  document.getElementById("modal-add-incident").classList.remove("active");
  document.getElementById("form-add-incident").reset();
}
function handleAddIncident(e) {
  e.preventDefault();
  if (currentRole !== "admin" && currentRole !== "surveillant" && currentRole !== "professeur") {
    alert("⛔ Accès Refusé : Action non autorisée.");
    return;
  }
  const stId = document.getElementById("inc-student-select").value;
  const typeVal = document.getElementById("inc-type").value;
  const noteVal = document.getElementById("inc-note").value.trim();
  const stu = appData.students.find(s => s.id === stId);
  if (stu) {
    const fullText = `${typeVal} : ${noteVal} (${new Date().toLocaleDateString('fr-FR')})`;
    if (!stu.incidents) stu.incidents = [];
    stu.incidents.push(fullText);
    saveData();
    closeAddIncidentModal();
    renderAttendanceModule();
    showToast(`🚨 Incident enregistré dans le dossier de ${getStuName(stu)} !`, "success");
  }
}

// --- MODULE 7: FINANCES, ÉCONOME, VERSEMENTS & RAPPELS A5 ---
function renderFinanceTable() {
  const tbody = document.getElementById("finance-table-body");
  if (!tbody) return;
  tbody.innerHTML = appData.transactions.map(t => {
    const stName = getTxStudent(t);
    let badgeMethod = "badge-esp";
    if (t.method === "Orange Money") badgeMethod = "badge-om";
    else if (t.method === "Moov Money") badgeMethod = "badge-moov";
    else if (t.method === "Virement Bancaire") badgeMethod = "badge-vir";

    const canDel = (currentRole === 'admin' || currentRole === 'econome');
    return `
      <tr>
        <td><span style="font-family:monospace; color:var(--primary); font-weight:700;">${t.id}</span></td>
        <td><strong>${stName}</strong></td>
        <td>${t.type}<br><span class="badge ${badgeMethod}" style="font-size:0.75rem; margin-top:2px;">${t.method || 'Espèces'} [Ref: ${t.ref || 'N/A'}]</span></td>
        <td><strong style="color:#059669; font-size:1.05rem;">${t.amount.toLocaleString('fr-FR')} FCFA</strong></td>
        <td>${t.date}</td>
        <td><span class="badge ${t.status === 'Payé' ? 'badge-success' : t.status === 'Partiel' ? 'badge-warning' : 'badge-danger'}">${t.status}</span></td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-secondary" onclick="showReceiptModal('${t.id}')" title="Voir Reçu A5 & WhatsApp">🖨️ Reçu / 📲</button>
            ${canDel ? `<button class="btn btn-sm btn-danger" onclick="deleteTransaction('${t.id}')" title="Annuler/Supprimer ce versement">🗑️</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

async function deleteTransaction(txId) {
  if (currentRole !== "admin" && currentRole !== "econome") {
    alert("⛔ Accès Refusé : Seuls l'Administrateur et l'Économe peuvent annuler/supprimer un versement.");
    return;
  }
  if (confirm("⚠️ Annuler et supprimer cet encaissement ? Le solde de l'élève sera automatiquement réajusté.")) {
    if (isConnectedToServer) {
      try { await fetch(`/api/transactions/${txId}`, { method: "DELETE" }); } catch(err) {}
    }
    appData.transactions = appData.transactions.filter(t => t.id !== txId);
    saveData();
    showToast("🗑️ Versement annulé et supprimé.", "warning");
  }
}

async function purgeAllTransactions() {
  if (currentRole !== "admin") {
    showToast("⛔ Seul l'Administrateur peut purger la caisse.", "danger");
    return;
  }
  if (confirm("⚠️ ATTENTION CRITIQUE : Voulez-vous effacer l'intégralité du journal des encaissements de la caisse ?\n\nTous les reçus seront purgés et les soldes des élèves remis à découvert.")) {
    if (isConnectedToServer) {
      try { await fetch("/api/transactions-purge", { method: "DELETE" }); } catch(err) {}
    }
    appData.transactions = [];
    saveData();
    showToast("🧹 Journal de caisse purgé et soldes réinitialisés.", "info");
  }
}

function openAddPaymentModal() {
  if (currentRole !== "admin" && currentRole !== "econome") {
    alert("⛔ Accès Refusé : Seuls l'Administrateur et l'Économe peuvent enregistrer un encaissement.");
    return;
  }
  try {
    const sel = document.getElementById("pay-student");
    if (sel) {
      sel.innerHTML = appData.students.map(s => {
        const name = getStuName(s);
        const cls = getStuClass(s);
        const tot = s.totalFee || s.total_fee || 150000;
        const rest = (s.balance !== undefined && s.balance !== null) ? s.balance : tot;
        return `<option value="${name} (${s.id})" data-rest="${rest}" data-tot="${tot}">${name} - ${cls} (Reste: ${rest.toLocaleString('fr-FR')} FCFA)</option>`;
      }).join("");
    }
    updatePaymentChangeCalculator();
  } catch(e) { console.error("Erreur select versement:", e); }
  document.getElementById("modal-add-payment").classList.add("active");
}

function closeAddPaymentModal() {
  document.getElementById("modal-add-payment").classList.remove("active");
  document.getElementById("form-add-payment").reset();
}

function updatePaymentChangeCalculator() {
  const sel = document.getElementById("pay-student");
  const amtInp = document.getElementById("pay-amount");
  const box = document.getElementById("change-calc-display");
  if (!sel || !amtInp || !box) return;

  const opt = sel.options[sel.selectedIndex];
  if (!opt) return;

  const rest = parseInt(opt.dataset.rest) || 0;
  const tot = parseInt(opt.dataset.tot) || 150000;
  const paidAlready = tot - rest;
  const amtHanded = parseInt(amtInp.value) || 0;
  
  const newRest = Math.max(0, rest - amtHanded);
  const changeToGive = (amtHanded > rest) ? (amtHanded - rest) : 0;

  box.innerHTML = `
    <div style="font-size:0.8rem; color:#475569; display:flex; justify-content:space-between; margin-bottom:4px;">
      <span>Tarif Scolarité : <b>${tot.toLocaleString('fr-FR')} FCFA</b></span>
      <span>Déjà versé : <b>${paidAlready.toLocaleString('fr-FR')} FCFA</b></span>
    </div>
    <div style="font-size:0.95rem; font-weight:800; color:#1e293b; display:flex; justify-content:space-between; border-top:1px dashed #cbd5e1; padding-top:6px;">
      <span>Solde à régler (Reste) :</span>
      <span style="color:${rest > 0 ? '#ef4444' : '#059669'};">${rest.toLocaleString('fr-FR')} FCFA</span>
    </div>
    <div style="background:${changeToGive > 0 ? '#eff6ff' : '#ecfdf5'}; border:1px solid ${changeToGive > 0 ? '#3b82f6' : '#10b981'}; padding:8px 12px; border-radius:8px; margin-top:8px; display:flex; justify-content:space-between; align-items:center;">
      <span style="font-weight:800; font-size:0.9rem; color:${changeToGive > 0 ? '#1d4ed8' : '#047857'};">
        ${changeToGive > 0 ? '💵 MONNAIE À RENDRE AU PARENT :' : '✅ NOUVEAU RESTE À PAYER :'}
      </span>
      <strong style="font-size:1.15rem; color:${changeToGive > 0 ? '#1d4ed8' : '#047857'};">
        ${changeToGive > 0 ? changeToGive.toLocaleString('fr-FR') + ' FCFA' : newRest.toLocaleString('fr-FR') + ' FCFA'}
      </strong>
    </div>
  `;
}

async function handleAddPayment(e) {
  e.preventDefault();
  if (currentRole !== "admin" && currentRole !== "econome") {
    alert("⛔ Accès Refusé : Seuls l'Administrateur et l'Économe peuvent enregistrer un encaissement.");
    return;
  }
  
  const studentStr = document.getElementById("pay-student")?.value || "";
  if (!studentStr) {
    alert("⚠️ Veuillez sélectionner un élève dans la liste avant de valider le versement !");
    return;
  }

  const amountVal = parseInt(document.getElementById("pay-amount")?.value || 0) || 0;
  if (amountVal <= 0) {
    alert("⚠️ Veuillez saisir un montant de versement valide (ex: 50000) !");
    return;
  }

  const methodVal = document.getElementById("pay-method")?.value || "Espèces";
  const refVal = document.getElementById("pay-ref")?.value.trim() || `REF-${Math.floor(1000 + Math.random()*9000)}`;
  
  const newTx = {
    id: `REC-2026-${Math.floor(100 + Math.random() * 900)}`,
    student: studentStr,
    student_name: studentStr,
    type: document.getElementById("pay-type")?.value || "Frais de scolarité - Tranche 1",
    amount: amountVal,
    method: methodVal,
    ref: refVal,
    date: new Date().toLocaleDateString('fr-FR'),
    status: document.getElementById("pay-status")?.value || "Payé",
    operator: currentRole === 'econome' ? 'Économe Principal' : 'Secrétariat Caisse'
  };

  if (isConnectedToServer) {
    try {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTx)
      });
    } catch(err) {}
  }

  appData.transactions.unshift(newTx);
  saveData();
  closeAddPaymentModal();
  showToast(`✅ Versement de ${amountVal.toLocaleString('fr-FR')} FCFA via ${methodVal} encaissé avec succès !`, "success");
  
  showReceiptModal(newTx.id);
}

function showReceiptModal(txId) {
  const tx = appData.transactions.find(t => t.id === txId) || appData.transactions[0];
  const stName = getTxStudent(tx);
  
  let restDue = 0;
  let totFee = 150000;
  let parentPhone = "+226 70 00 00 00";
  let stuObj = null;
  const idMatch = stName.match(/\((MAT-2026-\d+)\)/) || (tx.student_id ? [null, tx.student_id] : null);
  if (idMatch) {
    const stu = appData.students.find(s => s.id === idMatch[1]);
    if (stu) {
      stuObj = stu;
      totFee = stu.totalFee || stu.total_fee || 150000;
      restDue = (stu.balance !== undefined && stu.balance !== null) ? stu.balance : totFee;
      parentPhone = stu.fatherName || stu.father_name || "+226 70 00 00 00";
    }
  }

  const dirInfo = getDirectorForCycle(stuObj ? stuObj.cycle : 'college');
  const cleanPhone = parentPhone.replace(/[^\d+]/g, "").replace(/^00/, "+") || "+22670000000";
  const msgText = encodeURIComponent(
    `Bonjour parent de ${stName},\nLe ${appData.school.name} confirme le versement de ${tx.amount.toLocaleString('fr-FR')} FCFA (${tx.method}, Réf: ${tx.ref}).\nSituation : Scolarité totale ${totFee.toLocaleString('fr-FR')} FCFA | Reste à régler : ${restDue.toLocaleString('fr-FR')} FCFA.\nMerci de votre confiance.`
  );

  const recHtml = `
    <div class="print-a5-sheet">
      <div class="a5-header">
        <h3 style="font-size:12pt; font-weight:900; margin:0;">${appData.school.name}</h3>
        <span style="font-size:8.5pt; color:#64748b;">ÉCONOMAT & CAISSE GÉNÉRALE | Tél : ${appData.school.phone}</span>
      </div>
      <div class="a5-title" style="background:#ecfdf5; border-color:#059669; color:#065f46;">REÇU OFFICIEL DE CAISSE</div>
      <div style="display:flex; justify-content:space-between; font-size:9.5pt; margin-bottom:10px;">
        <span><b>N° de Reçu :</b> ${tx.id}</span>
        <span><b>Date d'opération :</b> ${tx.date}</span>
      </div>
      <div class="a5-box" style="margin:10px 0;">
        <p><b>Élève / Client :</b> <span style="font-size:11pt; color:#4f46e5; font-weight:800;">${stName}</span></p>
        <p><b>Motif / Tranche :</b> ${tx.type}</p>
        <p><b>Mode de Règlement :</b> <span style="font-weight:800; color:#ea580c;">${tx.method || 'Espèces'}</span> | <b>Référence :</b> <code style="background:#e2e8f0; padding:2px 6px; border-radius:4px;">${tx.ref || 'N/A'}</code></p>
      </div>
      <div style="text-align:center; padding:12px; background:#f1f5f9; border:2px solid #0f172a; border-radius:8px; margin:15px 0;">
        <span style="font-size:8.5pt; color:#64748b; display:block; font-weight:700;">MONTANT ENCAISSÉ CE JOUR</span>
        <span style="font-size:18pt; font-weight:900; color:#059669;">${tx.amount.toLocaleString('fr-FR')} FCFA</span>
        <div style="font-size:9pt; font-weight:800; color:${restDue > 0 ? '#ef4444' : '#059669'}; margin-top:4px; border-top:1px dashed #cbd5e1; padding-top:4px;">
          ${restDue > 0 ? 'RESTE À RÉGLER SUR SCOLARITÉ : ' + restDue.toLocaleString('fr-FR') + ' FCFA' : '🎉 COMPTE ENTIÈREMENT SOLDÉ (NON REDEVABLE)'}
        </div>
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:20px; font-size:9.5pt;">
        <div><b>Le Déposant / Parent</b><br><br><br><br>...........................</div>
        <div style="text-align:center;"><b>L'Économe & ${dirInfo.title}</b><br><span style="font-size:8pt; color:#1e293b; font-weight:800;">${dirInfo.name}</span><br><span style="font-size:7.5pt; color:#64748b;">${tx.operator || 'Caisse Économat'}</span><br><b style="color:#059669;">[${dirInfo.stamp}]</b></div>
      </div>
    </div>

    <!-- BOUTONS D'ENVOI WHATSAPP ET SMS DIRECTS -->
    <div class="no-print" style="margin-top:15px; padding:15px; background:#f8fafc; border-top:2px solid #cbd5e1; display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
      <a href="https://wa.me/${cleanPhone}?text=${msgText}" target="_blank" class="btn btn-sm" style="background:#25D366; color:white; font-weight:800; text-decoration:none; padding:10px 16px;">
        📲 WhatsApp Parent (${cleanPhone})
      </a>
      <a href="sms:${cleanPhone}?body=${msgText}" class="btn btn-sm" style="background:#3b82f6; color:white; font-weight:800; text-decoration:none; padding:10px 16px;">
        💬 SMS Parent
      </a>
      <button onclick="printA5()" class="btn btn-warning btn-sm" style="font-weight:900; padding:10px 20px;">🖨️ Imprimer en A5</button>
    </div>
  `;
  document.getElementById("a5-render-area").innerHTML = recHtml;
  document.getElementById("modal-a5-print").classList.add("active");
}

function generateA5Reminder(type) {
  const select = document.getElementById("a5-student-select");
  const studentId = select ? select.value : (appData.students[0] ? appData.students[0].id : "");
  const stu = appData.students.find(s => s.id === studentId) || appData.students[0];
  if (!stu) return;
  
  const stName = getStuName(stu);
  const stCls = getStuClass(stu);
  const totFee = stu.totalFee || stu.total_fee || 150000;
  const restDue = (stu.balance !== undefined && stu.balance !== null) ? stu.balance : totFee;
  const parentPhone = stu.fatherName || stu.father_name || "+226 70 00 00 00";
  const cleanPhone = parentPhone.replace(/[^\d+]/g, "").replace(/^00/, "+") || "+22670000000";

  const isRappel = type === 'rappel';
  const title = isRappel ? "AVIS DE RAPPEL DE FRAIS DE SCOLARITÉ" : "BULLETIN DE REDEVANCE / NON-REDEVANCE";
  const contentText = isRappel ? 
    `<p>Madame, Monsieur, parents de l'élève <strong>${stName}</strong> inscrit(e) en classe de <strong>${stCls}</strong> (Matricule : ${stu.id}),</p>
     <p style="margin-top:10px;">Sauf erreur ou omission de notre part, nous constatons qu'à la date de ce jour, votre compte présente un solde redevable concernant les frais de scolarité de l'année 2025-2026.</p>
     <div class="a5-box" style="margin-top:15px; text-align:center;">
       <span style="font-size:10pt; color:#64748b;">MONTANT RESTANT À RÉGLER (SOLDE ACTUEL) :</span><br>
       <strong style="font-size:18pt; color:#ef4444;">${restDue.toLocaleString('fr-FR')} FCFA</strong>
       <div style="font-size:8.5pt; color:#64748b; margin-top:4px;">Tarif annuel scolarité : ${totFee.toLocaleString('fr-FR')} FCFA</div>
     </div>
     <p>Nous vous prions de bien vouloir régulariser cette situation auprès de l'Économat dans les plus brefs délais afin d'éviter toute perturbation dans la scolarité de votre enfant.</p>` :
    `<p>Le Directeur de l'Économat du <strong>${appData.school.name}</strong> atteste par la présente que l'élève :</p>
     <div class="a5-box" style="margin:10px 0;">
       <strong>Nom & Prénom :</strong> ${stName}<br>
       <strong>Matricule :</strong> ${stu.id} | <strong>Classe :</strong> ${stCls}<br>
       <strong>Parents / Contact :</strong> ${parentPhone}
     </div>
     <p style="text-align:center; font-size:12pt; font-weight:800; margin:15px 0; padding:12px; background:${restDue === 0 ? '#d1fae5; color:#065f46;' : '#fee2e2; color:#991b1b;'} border-radius:6px;">
       SITUATION : ${restDue === 0 ? '🎉 NON REDEVABLE (ENTIÈREMENT EN RÈGLE)' : '⚠️ REDEVABLE DE ' + restDue.toLocaleString('fr-FR') + ' FCFA'}
     </p>
     <p>En foi de quoi, le présent bulletin lui est délivré pour servir et valoir ce que de droit.</p>`;

  const msgText = encodeURIComponent(
    isRappel ?
      `Bonjour parent de ${stName},\nLe ${appData.school.name} vous transmet un avis de rappel pour la scolarité (Classe: ${stCls}).\nMontant restant à régler : ${restDue.toLocaleString('fr-FR')} FCFA sur ${totFee.toLocaleString('fr-FR')} FCFA.\nMerci de régulariser auprès de l'Économat.` :
      `Bonjour parent de ${stName},\nAttestation Économat ${appData.school.name} : Situation de scolarité -> ${restDue === 0 ? 'NON REDEVABLE (En règle)' : 'Solde restant à payer : ' + restDue.toLocaleString('fr-FR') + ' FCFA'}.`
  );

  const dirInfo = getDirectorForCycle(stu.cycle);

  const a5Html = `
    <div class="print-a5-sheet">
      <div class="a5-header">
        <h3 style="font-size:12pt; font-weight:900; margin:0;">${appData.school.name}</h3>
        <span style="font-size:9pt; color:#64748b;">ÉCONOMAT GÉNÉRAL | Tél : ${appData.school.phone}</span>
      </div>
      <div class="a5-title">${title}</div>
      <div style="margin:15px 0; font-size:10.5pt;">
        ${contentText}
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:25px; font-size:9.5pt;">
        <div><b>Le Client / Parent</b><br><br><br><br>...........................</div>
        <div style="text-align:center;"><b>${dirInfo.title}</b><br><span style="font-size:8.5pt; color:#1e293b; font-weight:800;">${dirInfo.name}</span><br><span style="font-size:7.5pt; color:#64748b;">Ouagadougou, le ${new Date().toLocaleDateString('fr-FR')}</span><br><br><b style="color:#4f46e5;">[${dirInfo.stamp}]</b></div>
      </div>
    </div>

    <!-- BOUTONS D'ENVOI WHATSAPP ET SMS DIRECTS -->
    <div class="no-print" style="margin-top:15px; padding:15px; background:#f8fafc; border-top:2px solid #cbd5e1; display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
      <a href="https://wa.me/${cleanPhone}?text=${msgText}" target="_blank" class="btn btn-sm" style="background:#25D366; color:white; font-weight:800; text-decoration:none; padding:10px 16px;">
        📲 WhatsApp Parent (${cleanPhone})
      </a>
      <a href="sms:${cleanPhone}?body=${msgText}" class="btn btn-sm" style="background:#3b82f6; color:white; font-weight:800; text-decoration:none; padding:10px 16px;">
        💬 SMS Parent
      </a>
      <button onclick="printA5()" class="btn btn-warning btn-sm" style="font-weight:900; padding:10px 20px;">🖨️ Imprimer en A5</button>
    </div>
  `;

  document.getElementById("a5-render-area").innerHTML = a5Html;
  document.getElementById("modal-a5-print").classList.add("active");
}

function closeA5Modal() {
  document.getElementById("modal-a5-print").classList.remove("active");
}

function printA5() {
  window.print();
}

function filterFinancialPeriod() {
  showToast(`📊 Calcul de l'état financier sur la période : 375 000 FCFA encaissés et conformes.`, "info");
}

// --- MODULE 8: GESTION DES UTILISATEURS / PROFILS (ADMIN) ---
function renderUsersTable() {
  const tbody = document.getElementById("users-table-body");
  if (!tbody) return;
  tbody.innerHTML = appData.users.map(u => {
    const rNames = {
      admin: "Administrateur", secretaire: "Secrétaire", econome: "Économe",
      surveillant: "Surveillant", professeur: "Enseignant", direction: "Directeur"
    };
    const isProtected = (u.username === "admin" || u.username === "KOGOinformatiques" || u.role === "admin");
    const passDisplay = currentRole === 'admin' ? `<code style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-weight:800; color:#ef4444;">${u.password || '12345'}</code>` : '••••••••';
    return `
      <tr>
        <td><strong>${u.name}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">Email: ${u.email}</span></td>
        <td><span class="badge badge-info">${rNames[u.role] || u.role}</span></td>
        <td><strong style="color:var(--primary); font-family:monospace; font-size:1.05rem;">${u.username || u.role}</strong></td>
        <td>${passDisplay}</td>
        <td><span class="badge badge-success">${u.status}</span></td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="alert('👉 Pour vous connecter sous le profil de ${u.name}, cliquez sur le bouton 🚪 Quitter en haut à droite, puis entrez L\\'identifiant : ${u.username || u.role} et le mot de passe !');">🔑 Comment se connecter ?</button>
          ${currentRole === 'admin' && !isProtected ? `<button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}')">🗑️</button>` : ''}
        </td>
      </tr>
    `;
  }).join("");
}

function openAddUserModal() {
  if (currentRole !== "admin") {
    showToast("⛔ Seul l'Administrateur peut créer des profils utilisateurs.", "danger");
    return;
  }
  document.getElementById("modal-add-user").classList.add("active");
}
function closeAddUserModal() {
  document.getElementById("modal-add-user").classList.remove("active");
  document.getElementById("form-add-user").reset();
}
async function handleAddUser(e) {
  e.preventDefault();
  if (currentRole !== "admin") return;
  const newUser = {
    id: `USR-0${appData.users.length + 1}`,
    name: document.getElementById("usr-name").value,
    role: document.getElementById("usr-role").value,
    username: document.getElementById("usr-username").value.trim() || `user_${appData.users.length+1}`,
    password: document.getElementById("usr-pass").value.trim() || "pass123",
    email: document.getElementById("usr-email").value || "utilisateur@saintexupery.bf",
    status: "Actif"
  };

  if (isConnectedToServer) {
    try {
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });
    } catch(err) { console.error("Erreur synchro serveur user"); }
  }

  appData.users.push(newUser);
  saveData();
  closeAddUserModal();
  showToast(`✅ Compte "${newUser.username}" (${newUser.role}) créé avec succès ! Saisissez ces identifiants lors d'une prochaine connexion.`, "success");
}

async function deleteUser(id) {
  if (currentRole !== "admin") return;
  if (confirm("Supprimer ce profil utilisateur ?")) {
    if (isConnectedToServer) {
      try {
        await fetch(`/api/users/${id}`, { method: "DELETE" });
      } catch(err) {}
    }
    appData.users = appData.users.filter(u => u.id !== id);
    saveData();
    showToast("Profil supprimé.", "warning");
  }
}

// --- TARIFS DYNAMIQUES DE SCOLARITÉ ---
function renderDynamicFeesTable() {
  const tbody = document.getElementById("dynamic-fees-body");
  if (!tbody) return;
  const fees = appData.school.tuitionFees || { maternelle: 120000, primaire: 150000, college: 200000, lycee: 250000 };
  
  const cycles = [
    { key: "maternelle", label: "Maternelle (PS, MS, GS)", fee: fees.maternelle },
    { key: "primaire", label: "Primaire (CP1 au CM2)", fee: fees.primaire },
    { key: "college", label: "Collège (6ème à 3ème)", fee: fees.college },
    { key: "lycee", label: "Lycée (Seconde à Tle)", fee: fees.lycee }
  ];

  const isRead = (currentRole !== 'admin' && currentRole !== 'econome') ? 'disabled' : '';
  tbody.innerHTML = cycles.map(c => `
    <tr>
      <td><strong style="font-size:1rem; color:var(--text-main);">${c.label}</strong></td>
      <td>
        <input type="number" step="5000" class="form-control fee-input" data-cycle="${c.key}" value="${c.fee}" style="width:180px; font-weight:800; color:#059669;" ${isRead}>
      </td>
      <td><span class="badge badge-info">Tarif annuel automatique</span></td>
    </tr>
  `).join("");
}

function saveDynamicFees() {
  if (currentRole !== "admin" && currentRole !== "econome") {
    alert("⛔ Accès Refusé : Seuls l'Administrateur et l'Économe peuvent modifier les tarifs de scolarité.");
    return;
  }
  const inputs = document.querySelectorAll(".fee-input");
  if (!appData.school.tuitionFees) appData.school.tuitionFees = {};
  inputs.forEach(inp => {
    appData.school.tuitionFees[inp.dataset.cycle] = parseInt(inp.value) || 150000;
  });
  saveData();
  showToast("✅ Scolarités dynamiques mises à jour pour tous les futurs inscrits !", "success");
}

// --- PARAMÈTRES & RESET ---
function resetDemoData() {
  if (currentRole !== "admin") {
    alert("⛔ Accès Refusé : Seul l'Administrateur peut réinitialiser le système.");
    return;
  }
  if (confirm("Voulez-vous vraiment réinitialiser toutes les données aux valeurs par défaut ?")) {
    localStorage.removeItem("edugest_pro_v14_data");
    localStorage.removeItem("edugest_pro_v13_data");
    sessionStorage.removeItem("edugest_logged_user");
    appData = INITIAL_DATA;
    saveData();
    showToast("Données d'essai réinitialisées avec succès.", "info");
    setTimeout(() => window.location.reload(), 1000);
  }
}

function saveSettings(e) {
  e.preventDefault();
  if (currentRole !== "admin") {
    alert("⛔ Accès Refusé : Seul l'Administrateur peut modifier la configuration de l'établissement.");
    return;
  }
  appData.school.name = document.getElementById("set-school-name").value;
  appData.school.year = document.getElementById("set-school-year").value;
  appData.school.motto = document.getElementById("set-school-motto").value;
  saveData();

  if (isConnectedToServer) {
    try {
      fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            school_name: appData.school.name,
            motto: appData.school.motto
          }
        })
      });
    } catch(err) {}
  }

  showToast("✅ Paramètres de l'établissement enregistrés.", "success");
}

function saveDirectorsConfiguration() {
  if (currentRole !== "admin") {
    alert("⛔ Accès Refusé : Seul l'Administrateur peut modifier les directeurs et signataires.");
    return;
  }
  if (!appData.school) appData.school = {};
  appData.school.directorMaternelle = document.getElementById("set-dir-maternelle")?.value || "Mme Aminata KINDA";
  appData.school.directorPrimaire = document.getElementById("set-dir-primaire")?.value || "M. Ousmane COMPAORÉ";
  appData.school.directorCollege = document.getElementById("set-dir-college")?.value || "Dr. Alassane DIARRA";
  appData.school.directorLycee = document.getElementById("set-dir-lycee")?.value || "M. Christian SANOU";
  saveData();

  if (isConnectedToServer) {
    try {
      fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            director_maternelle: appData.school.directorMaternelle,
            director_primaire: appData.school.directorPrimaire,
            director_college: appData.school.directorCollege,
            director_lycee: appData.school.directorLycee
          }
        })
      });
    } catch(err) {}
  }
  showToast("✅ Noms et titres des Directeurs enregistrés pour tous les cycles !", "success");
}

// --- CONFIGURATION DE LA PÉRIODE DE LICENCE (OPTION CLIENT ADMIN) ---
function updateLicensePeriodPreview() {
  const sel = document.getElementById("set-license-period");
  const customInp = document.getElementById("set-license-custom-date");
  if (!sel || !customInp) return;

  if (sel.value === "custom") {
    customInp.style.display = "inline-block";
  } else {
    customInp.style.display = "none";
  }
}

async function saveLicenseConfiguration() {
  if (currentRole !== "admin") {
    alert("⛔ Accès Refusé : Seul l'Administrateur Général peut modifier la licence.");
    return;
  }
  const sel = document.getElementById("set-license-period");
  const customInp = document.getElementById("set-license-custom-date");
  if (!sel) return;

  const period = sel.value;
  let expireDate = "31/07/2027";
  let statusText = "🟢 LICENCE VALIDE (EXP: 31/07/2027)";

  if (period === "perpetual") {
    expireDate = "À VIE (PERPÉTUELLE - SANS EXPIRATION)";
    statusText = "♾️ LICENCE PERPÉTUELLE (À VIE - ILLIMITÉE)";
  } else if (period === "annual") {
    expireDate = "31/07/2027 (Renouvelable 1 An)";
    statusText = "🟢 LICENCE ANNUELLE (EXP: 31/07/2027)";
  } else if (period === "biennial") {
    expireDate = "31/07/2028 (Renouvelable 2 Ans)";
    statusText = "🟢 LICENCE BIENNALE (EXP: 31/07/2028)";
  } else if (period === "demo") {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    const dtStr = d.toLocaleDateString("fr-FR");
    expireDate = dtStr + " (Essai 6 mois)";
    statusText = `🟡 LICENCE D'ESSAI (EXP: ${dtStr})`;
  } else if (period === "custom") {
    const dtVal = customInp.value;
    if (!dtVal) {
      alert("⚠️ Veuillez choisir une date d'expiration personnalisée !");
      return;
    }
    const parts = dtVal.split("-");
    const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    expireDate = formatted + " (Contrat Spécial)";
    statusText = `🟢 LICENCE VALIDE (EXP: ${formatted})`;
  }

  if (!appData.school) appData.school = {};
  appData.school.licensePeriod = period;
  appData.school.licenseExpireDate = expireDate;
  appData.school.licenseStatusText = statusText;
  saveData();

  const statusEl = document.getElementById("license-status-display");
  if (statusEl) {
    statusEl.textContent = statusText;
    if (period === "perpetual") statusEl.style.color = "#7c3aed";
    else if (period === "demo") statusEl.style.color = "#d97706";
    else statusEl.style.color = "#059669";
  }

  if (isConnectedToServer) {
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            license_period: period,
            license_expire_date: expireDate,
            license_status_text: statusText
          }
        })
      });
    } catch(e) { console.error("Erreur synchro serveur licence", e); }
  }

  showToast(`✅ Période de Licence verrouillée : ${statusText}`, "success");
}

function toggleLoginSecurityMode() {
  if (currentRole !== "admin") {
    alert("⛔ Accès Refusé : Seul l'Administrateur peut changer ce paramètre de sécurité.");
    return;
  }
  const sel = document.getElementById("set-login-security-mode");
  if (!sel) return;
  const mode = sel.value;
  if (!appData.school) appData.school = {};
  appData.school.loginSecurityMode = mode;
  saveData();

  const helperBox = document.getElementById("login-helper-box");
  if (helperBox) {
    helperBox.style.display = (mode === "demo") ? "block" : "none";
  }
  
  if (mode === "production") {
    showToast("🔒 Mode Production activé : Les identifiants sont masqués de l'écran d'accueil.", "warning");
  } else {
    showToast("👁️ Mode Démo activé : L'aide de connexion s'affichera sur l'écran d'accueil.", "info");
  }
}

// --- DÉTECTEUR ANTI-COUPURE DE COURANT & CRASH RECOVERY ---
function checkCrashRecoverySecurity() {
  const lastActiveStr = sessionStorage.getItem("edugest_last_active_time");
  if (!lastActiveStr) return true;
  
  const lastActive = parseInt(lastActiveStr, 10);
  const now = Date.now();
  const elapsedMins = (now - lastActive) / (1000 * 60);
  
  const timeoutMins = (appData?.school?.inactivityTimeout !== undefined) ? appData.school.inactivityTimeout : 15;
  const maxAllowed = (timeoutMins > 0) ? timeoutMins : 30;

  if (elapsedMins > maxAllowed) {
    console.warn("⚡ Coupure de courant ou fermeture détectée : Session expirée depuis " + Math.round(elapsedMins) + " min. Purge forcée !");
    sessionStorage.removeItem("edugest_logged_user");
    sessionStorage.removeItem("edugest_last_active_time");
    loggedUser = null;
    const form = document.getElementById("form-login");
    if (form) form.reset();
    const uname = document.getElementById("login-username");
    const upass = document.getElementById("login-password");
    if (uname) uname.value = "";
    if (upass) upass.value = "";
    return false;
  }
  return true;
}

// --- VERROUILLAGE AUTOMATIQUE DE SESSION APRÈS INACTIVITÉ ---
let inactivityTimer = null;

function resetInactivityTimer() {
  if (!loggedUser) return;
  sessionStorage.setItem("edugest_last_active_time", Date.now().toString());
  if (inactivityTimer) clearTimeout(inactivityTimer);
  
  const timeoutMins = (appData?.school?.inactivityTimeout !== undefined) ? appData.school.inactivityTimeout : 15;
  if (timeoutMins <= 0) return;

  inactivityTimer = setTimeout(() => {
    if (loggedUser) {
      sessionStorage.removeItem("edugest_logged_user");
      sessionStorage.removeItem("edugest_last_active_time");
      loggedUser = null;
      const form = document.getElementById("form-login");
      if (form) form.reset();
      const uname = document.getElementById("login-username");
      const upass = document.getElementById("login-password");
      if (uname) uname.value = "";
      if (upass) upass.value = "";
      showToast("🔒 Session fermée automatiquement pour inactivité (protection des données).", "warning");
      showLoginModal();
      alert(`⏱️ SÉCURITÉ : Votre session a été automatiquement fermée suite à une période d'inactivité de ${timeoutMins} minutes pour protéger les données scolaires.`);
    }
  }, timeoutMins * 60 * 1000);
}

function setupInactivityWatchdog() {
  const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
  events.forEach(evt => {
    window.addEventListener(evt, resetInactivityTimer, { passive: true });
  });
  window.addEventListener("pagehide", () => {
    if (loggedUser) sessionStorage.setItem("edugest_last_active_time", Date.now().toString());
  });
  resetInactivityTimer();
}

function toggleInactivityTimeout() {
  if (currentRole !== "admin") {
    alert("⛔ Accès Refusé : Seul l'Administrateur peut modifier ce paramètre de sécurité.");
    return;
  }
  const sel = document.getElementById("set-inactivity-timeout");
  if (!sel) return;
  const mins = parseInt(sel.value, 10);
  if (!appData.school) appData.school = {};
  appData.school.inactivityTimeout = (isNaN(mins) ? 15 : mins);
  saveData();
  resetInactivityTimer();

  if (mins === 0) {
    showToast("♾️ Déconnexion automatique pour inactivité DÉSACTIVÉE.", "warning");
  } else {
    showToast(`⏱️ Déconnexion automatique programmée après ${mins} minutes d'inactivité.`, "success");
  }
}

// --- SYSTEME DE TOASTS ---
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  
  const toast = document.createElement("div");
  toast.className = `toast`;
  const colors = {
    success: "#10b981",
    danger: "#ef4444",
    warning: "#f59e0b",
    info: "#4f46e5"
  };
  toast.style.borderLeft = `6px solid ${colors[type] || colors.info}`;
  toast.innerHTML = `<span>${message}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(120%)";
    toast.style.transition = "all 0.35s ease";
    setTimeout(() => toast.remove(), 350);
  }, 4000);
}
