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

# Indicative unit prices in INR (order of magnitude of generic / Jan Aushadhi prices), used only to
# estimate the value of stock saved by redistribution. Not an official price list.
PRICES = {
    "M001": 0.5, "M002": 5.0, "M003": 2.5, "M004": 7.0, "M005": 0.4, "M006": 0.6, "M007": 0.5, "M008": 0.6,
    "M009": 0.3, "M010": 3.0, "M011": 0.8, "M012": 1.5, "M013": 0.6, "M014": 1.0, "M015": 0.3, "M016": 0.4,
    "M017": 0.8, "M018": 0.8, "M019": 25.0, "M020": 0.8, "M021": 0.2, "M022": 1.2, "M023": 0.8, "M024": 1.0,
    "M025": 30.0, "M026": 0.8, "M027": 0.8, "M028": 0.6,
}

# Approximate map positions for demo PHCs whose facility is not mapped in OpenStreetMap (block HQ area).
DEMO_COORDS = {
    "P01": (27.172785, 81.217103), "P02": (26.612745, 81.354302), "P03": (27.03, 81.02),
    "P04": (27.017244, 81.175794), "P05": (26.978474, 81.32096), "P06": (26.79, 81.36),
    "P07": (26.82, 81.44), "P08": (27.195277, 81.340733), "P09": (26.93, 81.21),
    "P10": (27.09, 81.49), "P11": (26.872152, 81.549568), "P12": (26.855683, 81.231888),
}
# OSM facilities that are the same place as a demo PHC (hidden to avoid duplicates on the map)
DEMO_DUPLICATES = {"CHC Fatehpur", "CHC Haidergarh", "CHC, Deva", "Primary Health Centre, Masauli",
                   "CHC,Suratganj", "PHC-Dariyabad", "PHC-Harakh"}
