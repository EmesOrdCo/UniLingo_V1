-- ============================================
-- Populate Sample Subjects Data
-- ============================================
-- This script populates the subject_words and lesson_scripts tables
-- with sample data to demonstrate the integration

-- Step 1: Insert sample subjects into subject_words table
INSERT INTO subject_words (
  english_translation, 
  subject, 
  french_translation, 
  spanish_translation, 
  german_translation, 
  mandarin_translation, 
  hindi_translation,
  example_sentence_english,
  example_sentence_french,
  example_sentence_spanish,
  example_sentence_german,
  example_sentence_mandarin,
  example_sentence_hindi,
  cefr_level
) VALUES 
-- Medicine subjects
('Diagnosis', 'Medicine', 'Diagnostic', 'Diagnóstico', 'Diagnose', '诊断', 'निदान', 'The doctor made a diagnosis based on the symptoms.', 'Le médecin a établi un diagnostic basé sur les symptômes.', 'El médico hizo un diagnóstico basado en los síntomas.', 'Der Arzt stellte eine Diagnose basierend auf den Symptomen.', '医生根据症状做出诊断。', 'डॉक्टर ने लक्षणों के आधार पर निदान किया।', 'B1'),
('Surgery', 'Medicine', 'Chirurgie', 'Cirugía', 'Chirurgie', '外科手术', 'सर्जरी', 'The surgery was successful and the patient recovered quickly.', 'La chirurgie a été un succès et le patient s''est rétabli rapidement.', 'La cirugía fue exitosa y el paciente se recuperó rápidamente.', 'Die Operation war erfolgreich und der Patient erholte sich schnell.', '手术很成功，病人恢复得很快。', 'सर्जरी सफल रही और मरीज़ जल्दी ठीक हो गया।', 'B1'),
('Prescription', 'Medicine', 'Ordonnance', 'Receta', 'Rezept', '处方', 'नुस्खा', 'The doctor wrote a prescription for antibiotics.', 'Le médecin a rédigé une ordonnance pour des antibiotiques.', 'El médico escribió una receta para antibióticos.', 'Der Arzt schrieb ein Rezept für Antibiotika.', '医生开了抗生素的处方。', 'डॉक्टर ने एंटीबायोटिक्स का नुस्खा लिखा।', 'A2'),

-- Engineering subjects
('Algorithm', 'Engineering', 'Algorithme', 'Algoritmo', 'Algorithmus', '算法', 'एल्गोरिदम', 'The algorithm efficiently sorts the data.', 'L''algorithme trie efficacement les données.', 'El algoritmo ordena los datos eficientemente.', 'Der Algorithmus sortiert die Daten effizient.', '算法有效地对数据进行排序。', 'एल्गोरिदम डेटा को कुशलतापूर्वक क्रमबद्ध करता है।', 'B2'),
('Infrastructure', 'Engineering', 'Infrastructure', 'Infraestructura', 'Infrastruktur', '基础设施', 'अवसंरचना', 'The city needs better infrastructure for transportation.', 'La ville a besoin d''une meilleure infrastructure de transport.', 'La ciudad necesita mejor infraestructura para el transporte.', 'Die Stadt braucht bessere Verkehrsinfrastruktur.', '这个城市需要更好的交通基础设施。', 'शहर को परिवहन के लिए बेहतर अवसंरचना की जरूरत है।', 'B2'),
('Prototype', 'Engineering', 'Prototype', 'Prototipo', 'Prototyp', '原型', 'प्रोटोटाइप', 'We built a prototype to test the concept.', 'Nous avons construit un prototype pour tester le concept.', 'Construimos un prototipo para probar el concepto.', 'Wir haben einen Prototyp gebaut, um das Konzept zu testen.', '我们建造了一个原型来测试这个概念。', 'हमने अवधारणा का परीक्षण करने के लिए एक प्रोटोटाइप बनाया।', 'B1'),

-- Physics subjects
('Quantum', 'Physics', 'Quantique', 'Cuántico', 'Quanten', '量子', 'क्वांटम', 'Quantum mechanics describes particle behavior.', 'La mécanique quantique décrit le comportement des particules.', 'La mecánica cuántica describe el comportamiento de las partículas.', 'Die Quantenmechanik beschreibt das Verhalten von Teilchen.', '量子力学描述粒子的行为。', 'क्वांटम मैकेनिक्स कण व्यवहार का वर्णन करता है।', 'C1'),
('Momentum', 'Physics', 'Moment', 'Momento', 'Impuls', '动量', 'संवेग', 'The momentum of the object increased with velocity.', 'L''élan de l''objet a augmenté avec la vélocité.', 'El momento del objeto aumentó con la velocidad.', 'Der Impuls des Objekts nahm mit der Geschwindigkeit zu.', '物体的动量随速度增加。', 'वस्तु का संवेग वेग के साथ बढ़ा।', 'B2'),
('Thermodynamics', 'Physics', 'Thermodynamique', 'Termodinámica', 'Thermodynamik', '热力学', 'ऊष्मागतिकी', 'Thermodynamics studies energy and heat transfer.', 'La thermodynamique étudie l''énergie et le transfert de chaleur.', 'La termodinámica estudia la energía y la transferencia de calor.', 'Die Thermodynamik untersucht Energie und Wärmeübertragung.', '热力学研究能量和热传递。', 'ऊष्मागतिकी ऊर्जा और ऊष्मा स्थानांतरण का अध्ययन करती है।', 'B2'),

-- Biology subjects
('Ecosystem', 'Biology', 'Écosystème', 'Ecosistema', 'Ökosystem', '生态系统', 'पारिस्थितिकी तंत्र', 'The forest ecosystem supports diverse species.', 'L''écosystème forestier soutient des espèces diverses.', 'El ecosistema forestal soporta especies diversas.', 'Das Waldökosystem unterstützt vielfältige Arten.', '森林生态系统支持多种物种。', 'वन पारिस्थितिकी तंत्र विविध प्रजातियों का समर्थन करता है।', 'B2'),
('Photosynthesis', 'Biology', 'Photosynthèse', 'Fotosíntesis', 'Photosynthese', '光合作用', 'प्रकाश संश्लेषण', 'Plants use photosynthesis to produce energy.', 'Les plantes utilisent la photosynthèse pour produire de l''énergie.', 'Las plantas usan la fotosíntesis para producir energía.', 'Pflanzen nutzen Photosynthese zur Energieerzeugung.', '植物利用光合作用产生能量。', 'पौधे ऊर्जा उत्पादन के लिए प्रकाश संश्लेषण का उपयोग करते हैं।', 'B1'),
('Evolution', 'Biology', 'Évolution', 'Evolución', 'Evolution', '进化', 'विकास', 'Evolution explains how species adapt over time.', 'L''évolution explique comment les espèces s''adaptent au fil du temps.', 'La evolución explica cómo las especies se adaptan con el tiempo.', 'Die Evolution erklärt, wie sich Arten im Laufe der Zeit anpassen.', '进化解释了物种如何随时间适应。', 'विकास बताता है कि प्रजातियां समय के साथ कैसे अनुकूलित होती हैं।', 'B2'),

-- Chemistry subjects
('Catalyst', 'Chemistry', 'Catalyseur', 'Catalizador', 'Katalysator', '催化剂', 'उत्प्रेरक', 'The catalyst speeds up the chemical reaction.', 'Le catalyseur accélère la réaction chimique.', 'El catalizador acelera la reacción química.', 'Der Katalysator beschleunigt die chemische Reaktion.', '催化剂加速化学反应。', 'उत्प्रेरक रासायनिक प्रतिक्रिया को तेज करता है।', 'B1'),
('Molecule', 'Chemistry', 'Molécule', 'Molécula', 'Molekül', '分子', 'अणु', 'Water is a simple molecule with two hydrogen atoms.', 'L''eau est une molécule simple avec deux atomes d''hydrogène.', 'El agua es una molécula simple con dos átomos de hidrógeno.', 'Wasser ist ein einfaches Molekül mit zwei Wasserstoffatomen.', '水是一个有两个氢原子的简单分子。', 'पानी दो हाइड्रोजन परमाणुओं वाला एक सरल अणु है।', 'A2'),
('Synthesis', 'Chemistry', 'Synthèse', 'Síntesis', 'Synthese', '合成', 'संश्लेषण', 'The synthesis of new compounds requires careful planning.', 'La synthèse de nouveaux composés nécessite une planification minutieuse.', 'La síntesis de nuevos compuestos requiere una planificación cuidadosa.', 'Die Synthese neuer Verbindungen erfordert sorgfältige Planung.', '新化合物的合成需要仔细规划。', 'नए यौगिकों का संश्लेषण सावधानीपूर्वक योजना की आवश्यकता है।', 'B2'),

-- Mathematics subjects
('Derivative', 'Mathematics', 'Dérivée', 'Derivada', 'Ableitung', '导数', 'अवकलज', 'The derivative shows the rate of change.', 'La dérivée montre le taux de changement.', 'La derivada muestra la tasa de cambio.', 'Die Ableitung zeigt die Änderungsrate.', '导数显示变化率。', 'अवकलज परिवर्तन की दर दिखाता है।', 'B2'),
('Probability', 'Mathematics', 'Probabilité', 'Probabilidad', 'Wahrscheinlichkeit', '概率', 'संभावना', 'Probability theory helps predict outcomes.', 'La théorie des probabilités aide à prédire les résultats.', 'La teoría de la probabilidad ayuda a predecir resultados.', 'Die Wahrscheinlichkeitstheorie hilft bei der Ergebnisvorhersage.', '概率论帮助预测结果。', 'संभावना सिद्धांत परिणामों की भविष्यवाणी में मदद करता है।', 'B1'),
('Statistics', 'Mathematics', 'Statistiques', 'Estadísticas', 'Statistik', '统计学', 'सांख्यिकी', 'Statistics help analyze data patterns.', 'Les statistiques aident à analyser les modèles de données.', 'Las estadísticas ayudan a analizar patrones de datos.', 'Statistiken helfen bei der Analyse von Datenmustern.', '统计学帮助分析数据模式。', 'सांख्यिकी डेटा पैटर्न का विश्लेषण करने में मदद करती है।', 'A2'),

-- Computer Science subjects
('Database', 'Computer Science', 'Base de données', 'Base de datos', 'Datenbank', '数据库', 'डेटाबेस', 'The database stores all user information securely.', 'La base de données stocke toutes les informations utilisateur en sécurité.', 'La base de datos almacena toda la información del usuario de forma segura.', 'Die Datenbank speichert alle Benutzerinformationen sicher.', '数据库安全地存储所有用户信息。', 'डेटाबेस सभी उपयोगकर्ता जानकारी को सुरक्षित रूप से संग्रहीत करता है।', 'A2'),
('Framework', 'Computer Science', 'Framework', 'Framework', 'Framework', '框架', 'फ्रेमवर्क', 'This framework simplifies web development.', 'Ce framework simplifie le développement web.', 'Este framework simplifica el desarrollo web.', 'Dieses Framework vereinfacht die Webentwicklung.', '这个框架简化了网络开发。', 'यह फ्रेमवर्क वेब डेवलपमेंट को सरल बनाता है।', 'B1'),
('Debugging', 'Computer Science', 'Débogage', 'Depuración', 'Debugging', '调试', 'डिबगिंग', 'Debugging is an essential programming skill.', 'Le débogage est une compétence de programmation essentielle.', 'La depuración es una habilidad de programación esencial.', 'Debugging ist eine wesentliche Programmierfähigkeit.', '调试是编程的基本技能。', 'डिबगिंग एक आवश्यक प्रोग्रामिंग कौशल है।', 'A2'),

-- Psychology subjects
('Cognitive', 'Psychology', 'Cognitif', 'Cognitivo', 'Kognitiv', '认知', 'संज्ञानात्मक', 'Cognitive psychology studies mental processes.', 'La psychologie cognitive étudie les processus mentaux.', 'La psicología cognitiva estudia los procesos mentales.', 'Die kognitive Psychologie untersucht mentale Prozesse.', '认知心理学研究心理过程。', 'संज्ञानात्मक मनोविज्ञान मानसिक प्रक्रियाओं का अध्ययन करता है।', 'B2'),
('Behavioral', 'Psychology', 'Comportemental', 'Conductual', 'Verhaltens', '行为', 'व्यवहारिक', 'Behavioral therapy helps modify negative patterns.', 'La thérapie comportementale aide à modifier les schémas négatifs.', 'La terapia conductual ayuda a modificar patrones negativos.', 'Verhaltenstherapie hilft, negative Muster zu ändern.', '行为疗法有助于改变消极模式。', 'व्यवहारिक चिकित्सा नकारात्मक पैटर्न को संशोधित करने में मदद करती है。', 'B1'),
('Neuroscience', 'Psychology', 'Neurosciences', 'Neurociencia', 'Neurowissenschaft', '神经科学', 'न्यूरोसाइंस', 'Neuroscience explores brain function.', 'Les neurosciences explorent le fonctionnement du cerveau.', 'La neurociencia explora la función cerebral.', 'Die Neurowissenschaft erforscht die Gehirnfunktion.', '神经科学探索大脑功能。', 'न्यूरोसाइंस मस्तिष्क के कार्य का अन्वेषण करता है।', 'B2'),

-- Economics subjects
('Inflation', 'Economics', 'Inflation', 'Inflación', 'Inflation', '通货膨胀', 'मुद्रास्फीति', 'Inflation affects purchasing power.', 'L''inflation affecte le pouvoir d''achat.', 'La inflación afecta el poder adquisitivo.', 'Die Inflation beeinflusst die Kaufkraft.', '通货膨胀影响购买力。', 'मुद्रास्फीति क्रय शक्ति को प्रभावित करती है।', 'B1'),
('Market', 'Economics', 'Marché', 'Mercado', 'Markt', '市场', 'बाजार', 'The market determines product prices.', 'Le marché détermine les prix des produits.', 'El mercado determina los precios de los productos.', 'Der Markt bestimmt die Produktpreise.', '市场决定产品价格。', 'बाजार उत्पाद कीमतों को निर्धारित करता है।', 'A2'),
('Supply', 'Economics', 'Offre', 'Oferta', 'Angebot', '供应', 'आपूर्ति', 'Supply and demand affect prices.', 'L''offre et la demande affectent les prix.', 'La oferta y la demanda afectan los precios.', 'Angebot und Nachfrage beeinflussen die Preise.', '供需影响价格。', 'आपूर्ति और मांग कीमतों को प्रभावित करती है।', 'A2'),

-- Law subjects
('Jurisdiction', 'Law', 'Juridiction', 'Jurisdicción', 'Gerichtsbarkeit', '管辖权', 'अधिकार क्षेत्र', 'The court has jurisdiction over this case.', 'Le tribunal a juridiction sur cette affaire.', 'El tribunal tiene jurisdicción sobre este caso.', 'Das Gericht hat Gerichtsbarkeit über diesen Fall.', '法院对此案有管辖权。', 'अदालत का इस मामले पर अधिकार क्षेत्र है।', 'B2'),
('Contract', 'Law', 'Contrat', 'Contrato', 'Vertrag', '合同', 'अनुबंध', 'The contract specifies the terms clearly.', 'Le contrat spécifie clairement les conditions.', 'El contrato especifica los términos claramente.', 'Der Vertrag legt die Bedingungen klar fest.', '合同明确规定条款。', 'अनुबंध शर्तों को स्पष्ट रूप से निर्दिष्ट करता है।', 'A2'),
('Litigation', 'Law', 'Contentieux', 'Litigio', 'Rechtsstreit', '诉讼', 'मुकदमेबाजी', 'Litigation can be expensive and time-consuming.', 'Les contentieux peuvent être coûteux et chronophages.', 'Los litigios pueden ser costosos y consumir mucho tiempo.', 'Rechtsstreitigkeiten können teuer und zeitaufwändig sein.', '诉讼可能昂贵且耗时。', 'मुकदमेबाजी महंगी और समय लेने वाली हो सकती है।', 'B1');

-- Step 2: Insert sample lesson scripts
INSERT INTO lesson_scripts (
  subject_name,
  english_lesson_script,
  french_lesson_script,
  german_lesson_script,
  spanish_lesson_script,
  mandarin_lesson_script,
  hindi_lesson_script,
  cefr_level
) VALUES 
('Medicine', 
'Welcome to Medical English! Today we''ll learn essential medical terminology. Medical professionals need precise language to communicate effectively about patient care, diagnoses, and treatments. Key terms include diagnosis, prognosis, symptoms, treatment, and therapy. Understanding these terms is crucial for medical communication.',
'Bienvenue à l''anglais médical ! Aujourd''hui, nous apprendrons la terminologie médicale essentielle. Les professionnels de la santé ont besoin d''un langage précis pour communiquer efficacement sur les soins aux patients, les diagnostics et les traitements.',
'Willkommen zum medizinischen Englisch! Heute lernen wir wesentliche medizinische Terminologie. Medizinische Fachkräfte benötigen präzise Sprache, um effektiv über Patientenversorgung, Diagnosen und Behandlungen zu kommunizieren.',
'¡Bienvenido al inglés médico! Hoy aprenderemos terminología médica esencial. Los profesionales médicos necesitan un lenguaje preciso para comunicarse efectivamente sobre la atención al paciente, diagnósticos y tratamientos.',
'欢迎来到医学英语！今天我们将学习基本的医学术语。医疗专业人员需要精确的语言来有效沟通患者护理、诊断和治疗。',
'मेडिकल अंग्रेजी में आपका स्वागत है! आज हम आवश्यक चिकित्सा शब्दावली सीखेंगे। चिकित्सा पेशेवरों को रोगी देखभाल, निदान और उपचार के बारे में प्रभावी ढंग से संवाद करने के लिए सटीक भाषा की आवश्यकता है।', 'B1'),

('Engineering',
'Engineering English covers technical communication, project management, and system design. Engineers must be able to explain complex concepts clearly to both technical and non-technical audiences. Important areas include algorithms, infrastructure, prototypes, and system architecture.',
'L''anglais d''ingénierie couvre la communication technique, la gestion de projet et la conception de systèmes. Les ingénieurs doivent pouvoir expliquer des concepts complexes clairement à des publics techniques et non techniques.',
'Ingenieur-Englisch umfasst technische Kommunikation, Projektmanagement und Systemdesign. Ingenieure müssen komplexe Konzepte sowohl technischen als auch nicht-technischen Publikum klar erklären können.',
'El inglés de ingeniería cubre comunicación técnica, gestión de proyectos y diseño de sistemas. Los ingenieros deben poder explicar conceptos complejos claramente a audiencias técnicas y no técnicas.',
'工程英语涵盖技术交流、项目管理和系统设计。工程师必须能够向技术和非技术受众清楚地解释复杂概念。',
'इंजीनियरिंग अंग्रेजी में तकनीकी संचार, परियोजना प्रबंधन और सिस्टम डिजाइन शामिल है। इंजीनियरों को जटिल अवधारणाओं को तकनीकी और गैर-तकनीकी दर्शकों के लिए स्पष्ट रूप से समझाने में सक्षम होना चाहिए।', 'B2'),

('Physics',
'Physics English involves precise terminology for describing natural phenomena, mathematical relationships, and experimental procedures. Key concepts include quantum mechanics, thermodynamics, momentum, and wave-particle duality. Clear communication is essential for scientific collaboration.',
'L''anglais de physique implique une terminologie précise pour décrire les phénomènes naturels, les relations mathématiques et les procédures expérimentales. Les concepts clés incluent la mécanique quantique, la thermodynamique, l''élan et la dualité onde-particule.',
'Physik-Englisch beinhaltet präzise Terminologie zur Beschreibung natürlicher Phänomene, mathematischer Beziehungen und experimenteller Verfahren. Schlüsselkonzepte sind Quantenmechanik, Thermodynamik, Impuls und Welle-Teilchen-Dualität.',
'El inglés de física involucra terminología precisa para describir fenómenos naturales, relaciones matemáticas y procedimientos experimentales. Los conceptos clave incluyen mecánica cuántica, termodinámica, momento y dualidad onda-partícula.',
'物理英语涉及描述自然现象、数学关系和实验程序的精确术语。关键概念包括量子力学、热力学、动量和波粒二象性。',
'भौतिकी अंग्रेजी में प्राकृतिक घटनाओं, गणितीय संबंधों और प्रयोगात्मक प्रक्रियाओं का वर्णन करने के लिए सटीक शब्दावली शामिल है। मुख्य अवधारणाओं में क्वांटम मैकेनिक्स, ऊष्मागतिकी, संवेग और तरंग-कण द्वैतता शामिल है।', 'B2'),

('Biology',
'Biology English covers life sciences terminology including genetics, ecology, evolution, and molecular biology. Scientists must communicate complex biological processes clearly. Key areas include cellular processes, ecosystem dynamics, and evolutionary mechanisms.',
'L''anglais de biologie couvre la terminologie des sciences de la vie, y compris la génétique, l''écologie, l''évolution et la biologie moléculaire. Les scientifiques doivent communiquer clairement les processus biologiques complexes.',
'Biologie-Englisch umfasst Terminologie der Lebenswissenschaften einschließlich Genetik, Ökologie, Evolution und Molekularbiologie. Wissenschaftler müssen komplexe biologische Prozesse klar kommunizieren.',
'El inglés de biología cubre terminología de ciencias de la vida incluyendo genética, ecología, evolución y biología molecular. Los científicos deben comunicar claramente procesos biológicos complejos.',
'生物学英语涵盖生命科学术语，包括遗传学、生态学、进化和分子生物学。科学家必须清楚地交流复杂的生物过程。',
'जीव विज्ञान अंग्रेजी में आनुवंशिकी, पारिस्थितिकी, विकास और आणविक जीव विज्ञान सहित जीवन विज्ञान शब्दावली शामिल है। वैज्ञानिकों को जटिल जैविक प्रक्रियाओं को स्पष्ट रूप से संवाद करना चाहिए।', 'B2'),

('Chemistry',
'Chemistry English involves precise terminology for chemical reactions, molecular structures, and laboratory procedures. Understanding terms like catalyst, synthesis, and molecular bonding is essential for chemical communication and research.',
'L''anglais de chimie implique une terminologie précise pour les réactions chimiques, les structures moléculaires et les procédures de laboratoire. Comprendre des termes comme catalyseur, synthèse et liaison moléculaire est essentiel.',
'Chemie-Englisch beinhaltet präzise Terminologie für chemische Reaktionen, Molekularstrukturen und Laborverfahren. Das Verständnis von Begriffen wie Katalysator, Synthese und molekularer Bindung ist wesentlich.',
'El inglés de química involucra terminología precisa para reacciones químicas, estructuras moleculares y procedimientos de laboratorio. Entender términos como catalizador, síntesis y enlace molecular es esencial.',
'化学英语涉及化学反应、分子结构和实验室程序的精确术语。理解催化剂、合成和分子键等术语对于化学交流和研究至关重要。',
'रसायन विज्ञान अंग्रेजी में रासायनिक प्रतिक्रियाओं, आणविक संरचनाओं और प्रयोगशाला प्रक्रियाओं के लिए सटीक शब्दावली शामिल है। उत्प्रेरक, संश्लेषण और आणविक बंधन जैसे शब्दों को समझना आवश्यक है।', 'B1');

-- Step 3: Show the results
SELECT 'Sample data inserted successfully!' as message;

SELECT 'Subjects in subject_words:' as info;
SELECT subject, COUNT(*) as word_count, 
       MIN(cefr_level) as min_level, 
       MAX(cefr_level) as max_level
FROM subject_words 
GROUP BY subject 
ORDER BY subject;

SELECT 'Subjects in lesson_scripts:' as info;
SELECT subject_name, cefr_level, 
       CASE WHEN english_lesson_script IS NOT NULL THEN 'Has Content' ELSE 'Empty' END as content_status
FROM lesson_scripts 
ORDER BY subject_name;

-- Step 4: Test the integration
SELECT 'Integration test - subjects available for frontend:' as info;
SELECT DISTINCT subject as available_subject
FROM (
  SELECT subject FROM subject_words
  UNION
  SELECT subject_name FROM lesson_scripts
) combined
ORDER BY available_subject;

