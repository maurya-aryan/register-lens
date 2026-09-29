"""Sample catalogue for the demo.

MEDICINES: common PHC-level essential medicines. Names follow the National List of
Essential Medicines (NLEM 2022) naming; this is a curated subset, not the full list.
PHCS: sample facilities in Barabanki district, Uttar Pradesh. STOCK DATA IS SYNTHETIC.
"""

# code, name, strength, form, unit, aliases, base_daily_issue (per PHC per day)
MEDICINES = [
    ("M001", "Paracetamol", "500 mg", "Tablet", "tabs", ["PCM", "PCM 500", "Para", "पैरासिटामोल", "Crocin"], 260),
    ("M002", "Oral Rehydration Salts", "WHO formula", "Sachet", "sachets", ["ORS", "ओआरएस", "O.R.S"], 40),
    ("M003", "Amoxicillin", "500 mg", "Capsule", "caps", ["Amox", "Amoxy", "एमोक्सिसिलिन"], 90),
    ("M004", "Azithromycin", "500 mg", "Tablet", "tabs", ["Azee", "Azithro", "एजिथ्रोमाइसिन"], 35),
    ("M005", "Cetirizine", "10 mg", "Tablet", "tabs", ["Cetrizine", "CTZ", "सेटिरिजिन"], 110),
    ("M006", "Metformin", "500 mg", "Tablet", "tabs", ["Metfor", "Met 500", "मेटफॉर्मिन"], 180),
    ("M007", "Amlodipine", "5 mg", "Tablet", "tabs", ["Amlo", "Aml 5", "एमलोडिपिन"], 150),
    ("M008", "Atenolol", "50 mg", "Tablet", "tabs", ["Aten", "एटेनोलोल"], 80),
    ("M009", "Iron and Folic Acid", "100 mg + 500 mcg", "Tablet", "tabs", ["IFA", "Iron Folic", "आयरन फोलिक"], 220),
    ("M010", "Albendazole", "400 mg", "Tablet", "tabs", ["Albend", "Alben", "एल्बेंडाजोल"], 30),
    ("M011", "Metronidazole", "400 mg", "Tablet", "tabs", ["Metro", "Metrogyl", "मेट्रोनिडाजोल"], 75),
    ("M012", "Ciprofloxacin", "500 mg", "Tablet", "tabs", ["Cipro", "Ciplox", "सिप्रोफ्लोक्सासिन"], 60),
    ("M013", "Ranitidine", "150 mg", "Tablet", "tabs", ["Rani", "Ranit", "रैनिटिडीन"], 70),
    ("M014", "Pantoprazole", "40 mg", "Tablet", "tabs", ["Panto", "Pan 40", "पैंटोप्राज़ोल"], 95),
    ("M015", "Salbutamol", "2 mg", "Tablet", "tabs", ["Salbu", "सल्बुटामोल"], 40),
    ("M016", "Diclofenac", "50 mg", "Tablet", "tabs", ["Diclo", "Voveran", "डाइक्लोफेनाक"], 85),
    ("M017", "Ibuprofen", "400 mg", "Tablet", "tabs", ["Ibu", "Brufen", "आइबुप्रोफेन"], 70),
    ("M018", "Zinc Sulphate", "20 mg", "Dispersible Tablet", "tabs", ["Zinc", "Zinc 20", "जिंक"], 45),
    ("M019", "Vitamin A", "100000 IU", "Solution", "bottles", ["Vit A", "विटामिन ए"], 6),
    ("M020", "Calcium Carbonate", "500 mg", "Tablet", "tabs", ["Calcium", "Cal 500", "कैल्शियम"], 130),
    ("M021", "Chlorpheniramine", "4 mg", "Tablet", "tabs", ["CPM", "Avil", "क्लोरफेनिरामिन"], 50),
    ("M022", "Doxycycline", "100 mg", "Capsule", "caps", ["Doxy", "डॉक्सीसाइक्लिन"], 40),
    ("M023", "Glimepiride", "1 mg", "Tablet", "tabs", ["Glim", "Glimepride", "ग्लिमेपिराइड"], 55),
    ("M024", "Losartan", "50 mg", "Tablet", "tabs", ["Losar", "Losartan 50", "लोसार्टन"], 65),
    ("M025", "Povidone Iodine", "5% solution", "Solution", "bottles", ["Betadine", "PVP-I", "पोविडोन आयोडीन"], 5),
    ("M026", "Chloroquine", "150 mg", "Tablet", "tabs", ["CQ", "क्लोरोक्वीन"], 25),
    ("M027", "Omeprazole", "20 mg", "Capsule", "caps", ["Omez", "Omep", "ओमेप्राज़ोल"], 100),
    ("M028", "Cotrimoxazole", "480 mg", "Tablet", "tabs", ["Septran", "Co-trim", "कोट्रिमोक्साजोल"], 45),
]

# id, name, block, district, state, size (patient load multiplier)
PHCS = [
    ("P01", "PHC Fatehpur", "Fatehpur", "Barabanki", "Uttar Pradesh", 1.2),
    ("P02", "PHC Haidergarh", "Haidergarh", "Barabanki", "Uttar Pradesh", 1.0),
    ("P03", "PHC Nindaura", "Nindaura", "Barabanki", "Uttar Pradesh", 0.8),
    ("P04", "PHC Dewa", "Dewa", "Barabanki", "Uttar Pradesh", 1.1),
    ("P05", "PHC Masauli", "Masauli", "Barabanki", "Uttar Pradesh", 0.9),
    ("P06", "PHC Siddhaur", "Siddhaur", "Barabanki", "Uttar Pradesh", 0.7),
    ("P07", "PHC Trivediganj", "Trivediganj", "Barabanki", "Uttar Pradesh", 0.85),
    ("P08", "PHC Suratganj", "Suratganj", "Barabanki", "Uttar Pradesh", 1.0),
    ("P09", "PHC Banki", "Banki", "Barabanki", "Uttar Pradesh", 0.95),
    ("P10", "PHC Ramnagar", "Ramnagar", "Barabanki", "Uttar Pradesh", 1.05),
    ("P11", "PHC Dariyabad", "Dariyabad", "Barabanki", "Uttar Pradesh", 0.9),
    ("P12", "PHC Harakh", "Harakh", "Barabanki", "Uttar Pradesh", 0.75),
]
