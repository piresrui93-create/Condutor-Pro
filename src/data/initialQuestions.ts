import { Question } from '../types';

export const INITIAL_QUESTIONS: Question[] = [
  // 1 - Roundabout Priority
  {
    id: 'imt-001',
    question: 'Aproximo-me de uma rotunda de sentido giratório. Qual veículo tem prioridade de passagem?',
    imageUrl: '/src/assets/images/traffic_roundabout_junction_1793442880154.jpg',
    imageCaption: 'Aproximação a rotunda urbana com sinal D5 e vias múltiplas.',
    options: [
      'O meu veículo, porque me apresento pela direita dos condutores que nela circulam.',
      'Os veículos que já se encontram a circular dentro da rotunda.',
      'Os veículos pesados de mercadorias que pretendam entrar na rotunda.'
    ],
    correctAnswer: 1,
    category: 'Regras de Prioridade e Cruzamentos',
    explanation: 'Nos termos do Artigo 31.º, n.º 1, alínea b) do Código da Estrada, o condutor que pretende entrar numa rotunda deve ceder a passagem aos veículos que nela já circulem.',
    lawArticle: 'Artigo 31.º do Código da Estrada',
    difficulty: 'medium',
    failureRate: 41
  },
  // 2 - Highway Speed Limit
  {
    id: 'imt-002',
    question: 'Ao circular nesta autoestrada ao volante de um automóvel ligeiro de passageiros sem reboque, qual é a velocidade máxima permitida indicada?',
    imageUrl: '/src/assets/images/highway_speed_limit_1793442881776.jpg',
    imageCaption: 'Pórtico de sinalização variável na A1 com indicação de limite de velocidade.',
    options: [
      '100 km/h.',
      '120 km/h.',
      '90 km/h.'
    ],
    correctAnswer: 1,
    category: 'Velocidades e Distâncias',
    explanation: 'De acordo com o Artigo 27.º do Código da Estrada, a velocidade máxima em autoestrada para automóveis ligeiros de passageiros é de 120 km/h, salvo sinalização em contrário.',
    lawArticle: 'Artigo 27.º do Código da Estrada',
    difficulty: 'easy',
    failureRate: 15
  },
  // 3 - Crossroad Priority to the Right
  {
    id: 'imt-003',
    question: 'Neste cruzamento desprovido de qualquer sinalização luminosa ou vertical, quem deve avançar em primeiro lugar?',
    imageUrl: '/src/assets/images/crossroad_priority_1793442881747.jpg',
    imageCaption: 'Interseção urbana sem semáforos, veículo vermelho aproxima-se pela direita.',
    options: [
      'O meu veículo, pois sigo em marcha em frente numa via principal.',
      'O veículo vermelho que se apresenta pela minha direita.',
      'Aquele que circular a maior velocidade.'
    ],
    correctAnswer: 1,
    category: 'Regras de Prioridade e Cruzamentos',
    explanation: 'Na ausência de sinalização em contrário, vigora a regra geral da prioridade da direita (Artigo 30.º do Código da Estrada): os condutores devem ceder a passagem aos veículos que se apresentem pela direita.',
    lawArticle: 'Artigo 30.º do Código da Estrada',
    difficulty: 'hard',
    failureRate: 58
  },
  // 4 - Night driving and lights
  {
    id: 'imt-004',
    question: 'A circular de noite sob condições de chuva e pavimento molhado, quais os médios ou luzes que devo obrigatoriamente manter acesos?',
    imageUrl: '/src/assets/images/night_fog_lighting_1793442881655.jpg',
    imageCaption: 'Condução noturna em estrada nacional com asfalto molhado e curva acentuada.',
    options: [
      'Apenas as luzes de presença (mínimos).',
      'As luzes de cruzamento (médios), para iluminar a via sem encandear outros condutores.',
      'As luzes de estrada (máximos), continuamente, mesmo ao cruzar-me com outros veículos.'
    ],
    correctAnswer: 1,
    category: 'Segurança Rodoviária, Luzes e Álcool',
    explanation: 'O Artigo 60.º do Código da Estrada estabelece a obrigatoriedade do uso das luzes de cruzamento (médios) desde o anoitecer até ao amanhecer e sempre que as condições atmosféricas imponham.',
    lawArticle: 'Artigo 60.º do Código da Estrada',
    difficulty: 'easy',
    failureRate: 22
  },
  // 5 - Cockpit & overtaking on motorway
  {
    id: 'imt-005',
    question: 'A circular na autoestrada, posso realizar a ultrapassagem pela via mais à direita?',
    imageUrl: '/src/assets/images/hero_driving_simulator_1793442879807.jpg',
    imageCaption: 'Perspetiva do condutor ao volante na autoestrada em tráfego fluido.',
    options: [
      'Sim, desde que sinalize a manobra com o indicador de mudança de direção.',
      'Não, a ultrapassagem deve efetuar-se pela esquerda, sendo a ultrapassagem pela direita uma contraordenação muito grave.',
      'Sim, desde que não ultrapasse o limite de 100 km/h.'
    ],
    correctAnswer: 1,
    category: 'Manobras e Vias Especiais',
    explanation: 'A ultrapassagem faz-se pela esquerda (Artigo 36.º do Código da Estrada). Ultrapassar pela direita é proibido e constitui infração muito grave sancionada com inibição de conduzir.',
    lawArticle: 'Artigo 36.º e 146.º do Código da Estrada',
    difficulty: 'hard',
    failureRate: 52
  },
  // 6 - Stop sign
  {
    id: 'imt-006',
    question: 'Perante o sinal B2 (STOP - Paragem Obrigatória no Cruzamento ou Entroncamento), o condutor deve:',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'Sinal B2 regulamentar octogonal colocado na aproximação a via com prioridade.',
    options: [
      'Abrandar a marcha e parar apenas se surgirem outros veículos com prioridade.',
      'Imobilizar obrigatoriamente o veículo junto da linha de paragem e ceder a passagem a todos os veículos.',
      'Parar apenas durante a noite ou com má visibilidade.'
    ],
    correctAnswer: 1,
    category: 'Sinais de Trânsito',
    explanation: 'O sinal B2 impõe ao condutor a paragem obrigatória antes de entrar na intersecção, bem como ceder a passagem a todos os veículos que transitem na via em que vai entrar.',
    lawArticle: 'Decreto Regulamentar n.º 22-A/98 - Sinal B2',
    difficulty: 'easy',
    failureRate: 18
  },
  // 7 - Alcohol Level - Regime Provisório
  {
    id: 'imt-007',
    question: 'Um condutor em regime probatório (primeiros 3 anos de carta) é considerado sob a influência do álcool se apresentar uma Taxa de Álcool no Sangue (TAS) igual ou superior a:',
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'Fiscalização policial rodoviária com controlo de alcoolemia.',
    options: [
      '0,50 g/l.',
      '0,20 g/l.',
      '0,80 g/l.'
    ],
    correctAnswer: 1,
    category: 'Segurança Rodoviária, Luzes e Álcool',
    explanation: 'Para novos condutores (regime probatório) e condutores profissionais, a taxa legal limite é de 0,20 g/l no sangue, nos termos do Artigo 81.º do Código da Estrada.',
    lawArticle: 'Artigo 81.º do Código da Estrada',
    difficulty: 'hard',
    failureRate: 64
  },
  // 8 - Continuous Line
  {
    id: 'imt-008',
    question: 'A linha longitudinal contínua (M1) a separar os dois sentidos de trânsito significa que:',
    imageUrl: 'https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'Estrada de duas vias com marca rodoviária longitudinal contínua.',
    options: [
      'É permitido pisá-la ou transpô-la para ultrapassar tratores agrícolas.',
      'É proibido pisar ou transpor a linha em qualquer circunstância.',
      'Pode ser transposta se a manobra for concluída em menos de 5 segundos.'
    ],
    correctAnswer: 1,
    category: 'Sinais de Trânsito',
    explanation: 'A marca rodoviária M1 (linha contínua) proíbe a todos os condutores pisá-la ou transpô-la, devendo os veículos manter-se à sua direita.',
    lawArticle: 'Regulamento de Sinalização do Trânsito, Artigo 60.º',
    difficulty: 'medium',
    failureRate: 38
  },
  // 9 - Stopping vs Parking
  {
    id: 'imt-009',
    question: 'Qual a diferença legal entre "Paragem" e "Estacionamento"?',
    imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'Veículo imobilizado na berma junto ao passeio.',
    options: [
      'Não existe qualquer diferença jurídica; são termos sinónimos.',
      'Paragem é a imobilização estritamente necessária para entrada/saída de passageiros ou cargas rápidas; estacionamento é a imobilização que não constitua paragem e não seja motivada pelo tráfego.',
      'Estacionamento é quando o motor se desliga; paragem é quando o motor fica ligado.'
    ],
    correctAnswer: 1,
    category: 'Manobras e Vias Especiais',
    explanation: 'Nos termos dos Artigos 48.º e 49.º do Código da Estrada, paragem é apenas a imobilização breve e necessária para a carga/descarga ou tomada/largada de passageiros com o condutor pronto a retomar a marcha.',
    lawArticle: 'Artigo 48.º do Código da Estrada',
    difficulty: 'medium',
    failureRate: 46
  },
  // 10 - Tire depth
  {
    id: 'imt-010',
    question: 'Qual é o limite mínimo legal de profundidade dos relevos do piso dos pneus para automóveis ligeiros de passageiros?',
    imageUrl: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'Pneu com indicador de desgaste TWI na banda de rodagem.',
    options: [
      '1,0 mm.',
      '1,6 mm.',
      '2,5 mm.'
    ],
    correctAnswer: 1,
    category: 'Mecânica Básica e Equipamentos',
    explanation: 'Os pneus dos automóveis ligeiros de passageiros devem ter um relevo na banda de rodagem com pelo menos 1,6 mm em todos os sulcos principais.',
    lawArticle: 'Regulamento de Homologação de Veículos e Pneus',
    difficulty: 'medium',
    failureRate: 33
  },
  // 11 - Overtaking at intersections
  {
    id: 'imt-011',
    question: 'É permitido ultrapassar nas intersecções (cruzamentos e entroncamentos)?',
    imageUrl: '/src/assets/images/crossroad_priority_1793442881747.jpg',
    imageCaption: 'Cruzamento urbano com visibilidade reduzida.',
    options: [
      'Não, é expressamente proibido efetuar ultrapassagens em todas as intersecções e imediatamente antes delas.',
      'Sim, desde que a intersecção tenha sinal de trânsito que conceda prioridade de passagem ou tenha trânsito regulado por semáforos/agente.',
      'Sim, se o veículo a ultrapassar for de tração animal.'
    ],
    correctAnswer: 1,
    category: 'Manobras e Vias Especiais',
    explanation: 'É proibido ultrapassar em cruzamentos, exceto quando a prioridade de passagem esteja claramente assinalada por sinalização que a conceda ou haja tráfego regulado por agente ou semáforos (Art. 41.º).',
    lawArticle: 'Artigo 41.º do Código da Estrada',
    difficulty: 'hard',
    failureRate: 61
  },
  // 12 - Speed limit inside locality
  {
    id: 'imt-012',
    question: 'Dentro de uma localidade, na ausência de sinalização em contrário, qual é a velocidade máxima permitida para um ligeiro de passageiros?',
    imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'Entrada de localidade assinalada com sinal N1.',
    options: [
      '60 km/h.',
      '50 km/h.',
      '40 km/h.'
    ],
    correctAnswer: 1,
    category: 'Velocidades e Distâncias',
    explanation: 'O limite geral de velocidade para automóveis ligeiros dentro de localidades é de 50 km/h (Artigo 27.º do Código da Estrada).',
    lawArticle: 'Artigo 27.º do Código da Estrada',
    difficulty: 'easy',
    failureRate: 12
  },
  // 13 - Distância de Segurança
  {
    id: 'imt-013',
    question: 'A distância de segurança entre o meu veículo e o veículo que me precede deve ser:',
    imageUrl: '/src/assets/images/highway_speed_limit_1793442881776.jpg',
    imageCaption: 'Dois automóveis a circular em autoestrada a alta velocidade.',
    options: [
      'De pelo menos 5 metros independentemente da velocidade.',
      'Suficiente para evitar o acidente em caso de paragem súbita ou travagem brusca do veículo da frente.',
      'O dobro do comprimento da viatura que nos precede.'
    ],
    correctAnswer: 1,
    category: 'Velocidades e Distâncias',
    explanation: 'O Artigo 18.º impõe que o condutor de um veículo em marcha deve manter entre o seu veículo e o que o precede a distância suficiente para evitar acidentes em caso de paragem ou travagem súbita deste.',
    lawArticle: 'Artigo 18.º do Código da Estrada',
    difficulty: 'medium',
    failureRate: 29
  },
  // 14 - Sinal C1 - Sentido Proibido
  {
    id: 'imt-014',
    question: 'O sinal de trânsito circular vermelho com uma barra horizontal branca ao centro significa:',
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'Sinal C1 de proibição fixado à entrada de uma rua.',
    options: [
      'Trânsito Proibido em ambos os sentidos a todos os veículos.',
      'Sentido Proibido, sendo vedada a entrada a todos os veículos.',
      'Proibição de virar à direita.'
    ],
    correctAnswer: 1,
    category: 'Sinais de Trânsito',
    explanation: 'O sinal C1 indica que é proibido o trânsito no sentido em que o sinal está voltado. É o clássico "Sentido Proibido".',
    lawArticle: 'Decreto Regulamentar n.º 22-A/98 - Sinal C1',
    difficulty: 'easy',
    failureRate: 14
  },
  // 15 - Reversing / Inversão de Marcha
  {
    id: 'imt-015',
    question: 'É permitida a manobra de marcha atrás em pontes, túneis e autoestradas?',
    imageUrl: '/src/assets/images/hero_driving_simulator_1793442879807.jpg',
    imageCaption: 'Entrada de túnel rodoviário com iluminação artificial.',
    options: [
      'Sim, desde que a marcha se faça lentamente e com quatro piscas ligados.',
      'Não, é estritamente proibido fazer marcha atrás em autoestradas, túneis, pontes e passagens de nível.',
      'Sim, caso tenha falhado uma saída em segurança.'
    ],
    correctAnswer: 1,
    category: 'Manobras e Vias Especiais',
    explanation: 'O Artigo 47.º proíbe a marcha atrás em autoestradas, pontes, túneis, passagens de nível e passagens de nível, sendo uma contraordenação muito grave.',
    lawArticle: 'Artigo 47.º e 72.º do Código da Estrada',
    difficulty: 'hard',
    failureRate: 59
  },
  // 16 - Triângulo de Pré-sinalização
  {
    id: 'imt-016',
    question: 'Em caso de avaria numa via fora de localidade, a que distância mínima do veículo deve ser colocado o triângulo de pré-sinalização de perigo?',
    imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'Triângulo retrorrefletor regulamentar armado na berma da estrada.',
    options: [
      'A pelo menos 30 metros da retaguarda do veículo, de modo a ser visível a pelo menos 100 metros.',
      'A 10 metros da retaguarda do veículo.',
      'A 50 metros da frente do veículo.'
    ],
    correctAnswer: 0,
    category: 'Segurança Rodoviária, Luzes e Álcool',
    explanation: 'O sinal de pré-sinalização de perigo deve ser colocado perpendicularmente em relação ao pavimento a pelo menos 30 metros do veículo e de modo a ser visível a 100 metros (Art. 88.º).',
    lawArticle: 'Artigo 88.º do Código da Estrada',
    difficulty: 'medium',
    failureRate: 43
  },
  // 17 - ABS (Sistema de Antibloqueio)
  {
    id: 'imt-017',
    question: 'Qual é a principal função e vantagem do sistema de travagem ABS num automóvel?',
    imageUrl: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'Luz avisadora do sistema ABS no painel de instrumentos.',
    options: [
      'Reduzir sempre para metade a distância de travagem em qualquer piso.',
      'Impedir o bloqueio das rodas durante uma travagem de emergência, mantendo o controlo da direção do veículo.',
      'Permitir travar sem carregar a fundo no pedal de travão.'
    ],
    correctAnswer: 1,
    category: 'Mecânica Básica e Equipamentos',
    explanation: 'O ABS (Anti-lock Braking System) impede que as rodas bloqueiem em travagens a fundo, permitindo ao condutor manter o controlo direcional do volante para contornar obstáculos.',
    lawArticle: 'Sistemas de Segurança Ativa Automóvel',
    difficulty: 'medium',
    failureRate: 35
  },
  // 18 - Cedência a veículos de socorro
  {
    id: 'imt-018',
    question: 'Ao avistar um veículo de polícia ou ambulância em marcha de socorro assinalada por avisadores sonoros e luminosos, os condutores devem:',
    imageUrl: 'https://images.unsplash.com/photo-1587740896339-96a76170508d?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'Ambulância com rotativos azuis de emergência acionados.',
    options: [
      'Acelerar rapidamente para desimpedir a faixa de rodagem.',
      'Ceder a passagem, encostando o mais possível à direita e, se necessário, parar.',
      'Ignorar o sinal se se encontrarem a circular numa via com prioridade.'
    ],
    correctAnswer: 1,
    category: 'Regras de Prioridade e Cruzamentos',
    explanation: 'Nos termos do Artigo 64.º e 65.º, os condutores devem facultar a passagem aos veículos prioritários em missão urgente de socorro, encostando à direita e parando se necessário.',
    lawArticle: 'Artigo 65.º do Código da Estrada',
    difficulty: 'easy',
    failureRate: 11
  },
  // 19 - Telemóvel ao volante
  {
    id: 'imt-019',
    question: 'A utilização ou manuseamento de telemóvel durante a condução sem recurso a sistema mãos-livres com auricular único é classificada como:',
    imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'Condutor ao volante com smartphone na mão.',
    options: [
      'Contraordenação leve punida apenas com admoestação.',
      'Contraordenação muito grave, com coima e perda de 3 pontos na carta de condução.',
      'Não é proibida se o veículo estiver parado num sinal vermelho.'
    ],
    correctAnswer: 1,
    category: 'Segurança Rodoviária, Luzes e Álcool',
    explanation: 'O uso de telemóvel ao volante foi agravado por lei para contraordenação muito grave (Art. 84.º e 146.º), sancionado com coima de 250€ a 1250€ e retirada de 3 pontos na carta.',
    lawArticle: 'Artigo 84.º e 146.º do Código da Estrada',
    difficulty: 'hard',
    failureRate: 55
  },
  // 20 - Rotundas - Saída
  {
    id: 'imt-020',
    question: 'Numa rotunda de duas vias, se o condutor pretende sair na primeira saída à direita, em que via de trânsito deve entrar e circular?',
    imageUrl: '/src/assets/images/traffic_roundabout_junction_1793442880154.jpg',
    imageCaption: 'Vias de aproximação à rotunda com setas de seleção pintadas no pavimento.',
    options: [
      'Na via mais à esquerda, mudando para a direita no último momento.',
      'Na via mais à direita de todas.',
      'Em qualquer uma das vias, desde que circule a menos de 40 km/h.'
    ],
    correctAnswer: 1,
    category: 'Manobras e Vias Especiais',
    explanation: 'Nos termos do Artigo 14.º-A do Código da Estrada, o condutor que pretenda sair na primeira saída deve ocupar previamente a via de trânsito mais à direita.',
    lawArticle: 'Artigo 14.º-A do Código da Estrada',
    difficulty: 'hard',
    failureRate: 53
  },
  // 21 - Aquaplanagem
  {
    id: 'imt-021',
    question: 'O fenómeno de "aquaplanagem" ou "hidroplanagem" acontece quando:',
    imageUrl: '/src/assets/images/night_fog_lighting_1793442881655.jpg',
    imageCaption: 'Lençol de água acumulado sobre a faixa de rodagem em dia de temporal.',
    options: [
      'O motor do veículo arrefece subitamente devido à água.',
      'Os pneus perdem contacto direto com o pavimento por formarem uma película de água sob a banda de rodagem, perdendo-se o controlo da direção.',
      'Os travões secam rapidamente devido à velocidade do vento.'
    ],
    correctAnswer: 1,
    category: 'Velocidades e Distâncias',
    explanation: 'A aquaplanagem ocorre quando os sulcos dos pneus não conseguem drenar a água acumulada, fazendo o carro "flutuar" sobre o lençol de água.',
    lawArticle: 'Segurança Rodoviária e Fatores de Risco',
    difficulty: 'medium',
    failureRate: 26
  },
  // 22 - Sinal B1 - Cedência de passagem
  {
    id: 'imt-022',
    question: 'O sinal B1 (triângulo invertido com rebordo vermelho e fundo branco) obriga a:',
    imageUrl: '/src/assets/images/crossroad_priority_1793442881747.jpg',
    imageCaption: 'Sinal B1 de cedência de passagem colocado à entrada da via.',
    options: [
      'Parar sempre, mesmo que não circule nenhum outro veículo na via com prioridade.',
      'Ceder a passagem a todos os veículos que transitem na via de que me aproximo, parando apenas se for necessário.',
      'Acelerar para entrar na via antes dos outros veículos.'
    ],
    correctAnswer: 1,
    category: 'Sinais de Trânsito',
    explanation: 'Diferente do sinal STOP (B2), o sinal B1 impõe cedência de passagem sem obrigar a paragem absoluta se a via com prioridade estiver desimpedida.',
    lawArticle: 'Decreto Regulamentar n.º 22-A/98 - Sinal B1',
    difficulty: 'easy',
    failureRate: 20
  },
  // 23 - Distância de Reação vs Travagem
  {
    id: 'imt-023',
    question: 'A Distância de Paragem Total é calculada pela soma de:',
    imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'Travagem de emergência sobre asfalto seco com marcas de pneumáticos.',
    options: [
      'Distância de Reação + Distância de Travagem.',
      'Distância do velocímetro + distância percorrida pelo veículo precedente.',
      'Distância de travagem multiplicada pelo tempo de sono.'
    ],
    correctAnswer: 0,
    category: 'Velocidades e Distâncias',
    explanation: 'Distância de Paragem = Distância percorrida durante o tempo de reação do condutor (aprox. 1 seg) somada à distância percorrida enquanto os travões atuam até o veículo imobilizar.',
    lawArticle: 'Física da Condução e Segurança Rodoviária',
    difficulty: 'medium',
    failureRate: 37
  },
  // 24 - Cruzamento de veículos em passagem estreita
  {
    id: 'imt-024',
    question: 'Numa via com forte inclinação e passagem estreita que impeça o cruzamento simultâneo, qual o veículo que tem o dever de recuar?',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'Estrada de montanha sinuosa e estreita em declive acentuado.',
    options: [
      'O veículo que sobe.',
      'O veículo que desce, salvo se for manifestamente mais fácil para o que sobe.',
      'O veículo mais leve.'
    ],
    correctAnswer: 1,
    category: 'Regras de Prioridade e Cruzamentos',
    explanation: 'Nos termos do Artigo 33.º do Código da Estrada, nas vias de forte inclinação, se for necessário recuar, deve fazê-lo o condutor do veículo que desce.',
    lawArticle: 'Artigo 33.º do Código da Estrada',
    difficulty: 'hard',
    failureRate: 67
  },
  // 25 - Nível do óleo do motor
  {
    id: 'imt-025',
    question: 'Como e quando deve ser verificada a vareta do nível de óleo do motor?',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'Vareta de medição do nível de óleo de motor com marcas Min e Max.',
    options: [
      'Com o motor a trabalhar a altas rotações numa descida íngreme.',
      'Com o veículo numa superfície plana, motor frio ou desligado há vários minutos, entre as marcas MIN e MAX.',
      'Sempre acima da marca MAX para garantir lubrificação total.'
    ],
    correctAnswer: 1,
    category: 'Mecânica Básica e Equipamentos',
    explanation: 'A medição do nível de óleo faz-se com o veículo nivelado horizontalmente e o motor frio/desligado para que o óleo repouse no cárter, devendo ficar entre as marcas MIN e MAX.',
    lawArticle: 'Manutenção Preventiva Automóvel',
    difficulty: 'easy',
    failureRate: 19
  },
  // 26 - Cinto de segurança para grávidas
  {
    id: 'imt-026',
    question: 'As mulheres grávidas estão isentas do uso do cinto de segurança?',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'Cinto de segurança de 3 pontos afivelado corretamente.',
    options: [
      'Sim, todas as grávidas estão automaticamente isentas por lei.',
      'Não, o uso é obrigatório salvo se possuírem atestado médico comprovativo de contraindicação médica grave.',
      'Estão isentas apenas no banco de trás.'
    ],
    correctAnswer: 1,
    category: 'Segurança Rodoviária, Luzes e Álcool',
    explanation: 'A gravidez não confere dispensa automática do uso do cinto de segurança (Art. 82.º). A isenção só é válida mediante apresentação de atestado médico emitido pela autoridade competente.',
    lawArticle: 'Artigo 82.º do Código da Estrada',
    difficulty: 'hard',
    failureRate: 50
  },
  // 27 - Autoestrada - Reboque de avariados
  {
    id: 'imt-027',
    question: 'Numa autoestrada é permitido o reboque de um veículo avariado por um veículo particular com corda ou cabo?',
    imageUrl: '/src/assets/images/highway_speed_limit_1793442881776.jpg',
    imageCaption: 'Circulação em autoestrada com berma de emergência desimpedida.',
    options: [
      'Sim, se a velocidade for inferior a 40 km/h.',
      'Não, é expressamente proibido o reboque particular em autoestrada, devendo ser utilizado veículo pronto-socorro homologado.',
      'Sim, desde que circulem na faixa da direita com os 4 piscas.'
    ],
    correctAnswer: 1,
    category: 'Manobras e Vias Especiais',
    explanation: 'Nas autoestradas e vias reservadas a automóveis e motociclos é estritamente proibido o reboque de veículos sem ser por veículos especificamente homologados para socorro (Artigo 72.º).',
    lawArticle: 'Artigo 72.º do Código da Estrada',
    difficulty: 'hard',
    failureRate: 48
  },
  // 28 - Sinal D1a - Sentido Obrigatório
  {
    id: 'imt-028',
    question: 'O sinal circular azul com uma seta branca a apontar para a frente (D1a) impõe:',
    imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'Sinal de obrigação D1a colocado sobre o separador de tráfego.',
    options: [
      'Sentido único de circulação em toda a localidade.',
      'Obrigação de seguir em frente na próxima intersecção.',
      'Fim da obrigação de circular à direita.'
    ],
    correctAnswer: 1,
    category: 'Sinais de Trânsito',
    explanation: 'O sinal D1a pertence à família de sinais de obrigação e determina que o condutor é obrigado a seguir em frente.',
    lawArticle: 'Decreto Regulamentar n.º 22-A/98 - Sinais de Obrigação',
    difficulty: 'easy',
    failureRate: 16
  },
  // 29 - Fadiga e tempo de condução
  {
    id: 'imt-029',
    question: 'Numa viagem longa de automóvel, qual a recomendação máxima de tempo de condução ininterrupta antes de realizar uma pausa de descanso?',
    imageUrl: '/src/assets/images/hero_driving_simulator_1793442879807.jpg',
    imageCaption: 'Área de serviço rodoviária para descanso de condutores.',
    options: [
      'Conduzir no máximo 2 horas consecutivas ou cerca de 200 km, fazendo uma paragem de pelo menos 15 a 20 minutos.',
      'Conduzir 5 horas seguidas tomando bebidas energéticas.',
      'Não é necessário parar se a janela estiver aberta.'
    ],
    correctAnswer: 0,
    category: 'Segurança Rodoviária, Luzes e Álcool',
    explanation: 'Para evitar sonolência e perda de reflexos, recomenda-se uma pausa de pelo menos 15 a 20 minutos a cada duas horas de condução.',
    lawArticle: 'Recomendações Oficiais ANSR e IMT',
    difficulty: 'easy',
    failureRate: 17
  },
  // 30 - Passagem para peões
  {
    id: 'imt-030',
    question: 'Ao aproximar-se de uma passagem de peões desprovida de sinalização luminosa, onde um peão já iniciou a travessia, o condutor deve:',
    imageUrl: '/src/assets/images/crossroad_priority_1793442881747.jpg',
    imageCaption: 'Passadeira com marcação zebra na aproximação a escola.',
    options: [
      'Avisar o peão com sinal sonoro (buzina) e manter a velocidade constante.',
      'Reduzir a velocidade e, se necessário, parar para deixar passar o peão.',
      'Avançar rapidamente se o peão estiver no lado esquerdo da passadeira.'
    ],
    correctAnswer: 1,
    category: 'Regras de Prioridade e Cruzamentos',
    explanation: 'O Artigo 103.º do Código da Estrada impõe que o condutor deve abrandar e, se necessário, parar para deixar passar os peões ou ciclistas que já tenham iniciado ou estejam prestes a iniciar a travessia.',
    lawArticle: 'Artigo 103.º do Código da Estrada',
    difficulty: 'easy',
    failureRate: 13
  },
  // 31 - Hard question: Via de trânsito em rotundas (saída na 3ª saída)
  {
    id: 'imt-031',
    question: 'Numa rotunda com 3 vias de circulação, se pretendo sair na 3.ª saída (à esquerda em relação à entrada), que via devo utilizar?',
    imageUrl: '/src/assets/images/traffic_roundabout_junction_1793442880154.jpg',
    imageCaption: 'Rotunda com três vias concêntricas e tráfego intenso.',
    options: [
      'A via da direita desde o início até à saída.',
      'A via mais à esquerda (ou interior), passando progressivamente para as vias exteriores após passar a saída imediatamente anterior à pretendida.',
      'A berma da rotunda.'
    ],
    correctAnswer: 1,
    category: 'Regras de Prioridade e Cruzamentos',
    explanation: 'Segundo o Artigo 14.º-A, quem não pretende sair na 1.ª saída deve ocupar a via de trânsito da esquerda e aproximar-se progressivamente da direita após ultrapassar a saída anterior à pretendida.',
    lawArticle: 'Artigo 14.º-A do Código da Estrada',
    difficulty: 'hard',
    failureRate: 68
  },
  // 32 - Hard question: Sinal de Cedência a quem sai de caminho particular
  {
    id: 'imt-032',
    question: 'O condutor de um veículo a motor que saia de um parque de estacionamento, abastecedor de combustível ou caminho particular deve ceder a passagem:',
    imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'Saída de posto de combustível com acesso à estrada nacional.',
    options: [
      'Apenas aos veículos que circulem pela sua direita.',
      'A todos os veículos que circulem na via pública em que vai entrar.',
      'Apenas aos transportes públicos de passageiros.'
    ],
    correctAnswer: 1,
    category: 'Regras de Prioridade e Cruzamentos',
    explanation: 'O Artigo 31.º, n.º 1, alínea a) do Código da Estrada estipula que o condutor deve ceder passagem a todos os veículos que transitem na via ao entrar a partir de caminhos particulares, garagens ou parques.',
    lawArticle: 'Artigo 31.º do Código da Estrada',
    difficulty: 'hard',
    failureRate: 54
  },
  // 33 - Hard question: Distância com chuva e aderência
  {
    id: 'imt-033',
    question: 'Em piso com pavimento molhado e chuva intensa, a distância de travagem de um veículo ligeiro em comparação com pavimento seco:',
    imageUrl: '/src/assets/images/night_fog_lighting_1793442881655.jpg',
    imageCaption: 'Chuva batida contra o para-brisas em estrada nacional com asfalto brilhante.',
    options: [
      'Mantém-se exatamente igual graças aos sistemas eletrónicos ESP.',
      'Aumenta para cerca do dobro em relação ao piso seco.',
      'Diminui devido ao efeito lubrificante e de arrefecimento da borracha.'
    ],
    correctAnswer: 1,
    category: 'Velocidades e Distâncias',
    explanation: 'Em piso molhado o coeficiente de atrito cai drasticamente, podendo a distância de travagem duplicar em relação às condições ideais de pavimento seco.',
    lawArticle: 'Dinâmica de Segurança Rodoviária',
    difficulty: 'medium',
    failureRate: 40
  },
  // 34 - Hard question: Coletes refletores
  {
    id: 'imt-034',
    question: 'Quando é obrigatório vestir o colete retrorrefletor de alta visibilidade?',
    imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'Colete amarelo fluorescente homologado EN 471.',
    options: [
      'Sempre que o condutor saia do veículo na faixa de rodagem ou berma para colocação do triângulo ou reparação de avaria.',
      'Apenas durante a noite nas autoestradas.',
      'Sempre que conduzir com as janelas abertas.'
    ],
    correctAnswer: 0,
    category: 'Segurança Rodoviária, Luzes e Álcool',
    explanation: 'O colete deve ser vestido pelo condutor antes de sair do veículo na via ou na berma em situações de avaria ou acidente (Artigo 88.º).',
    lawArticle: 'Artigo 88.º do Código da Estrada',
    difficulty: 'medium',
    failureRate: 36
  },
  // 35 - Hard question: Ultrapassagem a velocípedes (ciclistas)
  {
    id: 'imt-035',
    question: 'Ao ultrapassar um ciclista (velocípede) que circule na berma ou na faixa de rodagem, o condutor de um automóvel deve guardar uma distância lateral mínima de:',
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'Ciclista a circular no bordo direito de estrada secundária.',
    options: [
      '50 centímetros.',
      '1,5 metros.',
      '3 metros.'
    ],
    correctAnswer: 1,
    category: 'Manobras e Vias Especiais',
    explanation: 'O Artigo 38.º, n.º 2, alínea e) determina expressamente a distância lateral mínima de 1,5 metros e o abrandamento da velocidade na ultrapassagem a velocípedes.',
    lawArticle: 'Artigo 38.º do Código da Estrada',
    difficulty: 'hard',
    failureRate: 63
  },
  // 36 - Autoestrada - Velocidade mínima
  {
    id: 'imt-036',
    question: 'Em autoestrada, qual é a velocidade mínima a que um veículo pode transitar, salvo motivos atendíveis de tráfego?',
    imageUrl: '/src/assets/images/highway_speed_limit_1793442881776.jpg',
    imageCaption: 'Faixas de rodagem de autoestrada com limite mínimo legal.',
    options: [
      '40 km/h.',
      '50 km/h.',
      '60 km/h.'
    ],
    correctAnswer: 1,
    category: 'Velocidades e Distâncias',
    explanation: 'O Artigo 27.º e Artigo 72.º estipulam que nas autoestradas os veículos não podem transitar a velocidade inferior a 50 km/h sem motivo justificado.',
    lawArticle: 'Artigo 27.º do Código da Estrada',
    difficulty: 'medium',
    failureRate: 44
  }
];
