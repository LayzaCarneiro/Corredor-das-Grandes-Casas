/**
 * data.js - Configurações das Casas e Pôsteres
 * 
 * POSTER_PATHS: caminhos das imagens de cada casa.
 * POSTERS_CONFIG: posição, rotação, textura e informações para cada pôster.
 */

// --- Caminhos para imagens dos pôsteres ---
export const POSTER_PATHS = [
  '../assets/houses/stark-poster.png',
  '../assets/houses/lannister-poster.png',
  '../assets/houses/baratheon-poster.png',
  '../assets/houses/targaryen-poster.png',
  '../assets/houses/tyrell-poster.png',
  '../assets/houses/arryn-poster.png',
  '../assets/houses/greyjoy-poster.png',
  '../assets/houses/martell-poster.png',
];

// --- Configurações detalhadas dos pôsteres ---
export const POSTERS_CONFIG = [
  // --- PAREDE ESQUERDA (x: -2.45) ---
  { 
    x: -2.45, y: 1.8, z: 4.0, rotateY: Math.PI / 2, texIndex: 0,
    title: "Casa Stark",
    info: `
      Lema: "O Inverno Está Chegando"
      Senhores de Winterfell, protetores do Norte.
      Membros notáveis: Eddard, Arya, Jon Snow.
      Curiosidade: Cada filho tem um lobo gigante correspondente.
      Evento icônico: Participaram da Rebelião de Robert e da Guerra dos Cinco Reis.
    `,
    uiColor: "#1f2933", // cor de fundo escura azulada
    textColor: "#f5f5f5" // cor do texto
  },
  { 
    x: -2.45, y: 1.8, z: 9.0, rotateY: Math.PI / 2, texIndex: 1,
    title: "Casa Lannister",
    info: `
      Lema: "Ouça-me Rugir"
      Rica e influente, controlam as minas de ouro de Rochedo Casterly.
      Membros notáveis: Tywin, Cersei, Jaime, Tyrion.
      Curiosidade: Famosos por riqueza e astúcia política.
      Evento icônico: Guerra dos Cinco Reis e manipulação da política em Porto Real.
    `,
    uiColor: "#810d00", // vermelho bordô
    textColor: "#fff8f0"
  },
  { 
    x: -2.45, y: 1.8, z: 14.0, rotateY: Math.PI / 2, texIndex: 4,
    title: "Casa Tyrell",
    info: `
      Lema: "Crescendo Fortes"
      Senhores da Campina, sua sede é o castelo Jardim de Cima.
      Membros notáveis: Mace, Olenna, Loras Tyrell.
      Curiosidade: Conhecidos por intrigas e alianças estratégicas.
      Evento icônico: Apoiaram a coroação de Joffrey Baratheon e participaram da batalha de Porto Real.
    `,
    uiColor: "rgba(0,102,0,0.8)",    // verde escuro
    textColor: "#e6f5d0"
  },
  { 
    x: -2.45, y: 1.8, z: 19.0, rotateY: Math.PI / 2, texIndex: 5,
    title: "Casa Arryn",
    info: `
      Lema: "Tão Alto como a Honra"
      Protetores do Vale, vivem no impenetrável Ninho da Águia.
      Membros notáveis: Jon Arryn, Lysa, Robin.
      Curiosidade: Casa isolada e quase intocável devido à geografia.
      Evento icônico: A morte de Jon Arryn desencadeou os eventos da Guerra dos Cinco Reis.
    `,
    uiColor: "rgba(153,204,255,0.8)", // azul celeste
    textColor: "#00264d"
  },

  // --- PAREDE DIREITA (x: 2.45) ---
  { 
    x: 2.45, y: 1.8, z: 6.5, rotateY: -Math.PI / 2, texIndex: 2,
    title: "Casa Baratheon",
    info: `
      Lema: "Nossa é a Fúria"
      Conquistaram o Trono de Ferro após a Rebelião de Robert.
      Membros notáveis: Robert, Stannis, Renly.
      Curiosidade: Conhecidos pela força e temperamento explosivo.
      Evento icônico: Rebelião de Robert e guerra civil subsequente.
    `,
    uiColor: "rgba(255,204,51,0.8)",  // amarelo dourado
    textColor: "#330d00"
  },
  { 
    x: 2.45, y: 1.8, z: 11.5, rotateY: -Math.PI / 2, texIndex: 3,
    title: "Casa Targaryen",
    info: `
      Lema: "Fogo e Sangue"
      Últimos senhores dos dragões da antiga Valíria.
      Membros notáveis: Aerys II, Daenerys, Viserys.
      Curiosidade: Sua linhagem é conhecida pelos cabelos platinados e olhos violeta.
      Evento icônico: Queda do Trono de Ferro e a guerra pelo retorno de Daenerys.
    `,
    uiColor: "#330000", // vermelho escuro quase preto
    textColor: "#ffcccc"
  },
  { 
    x: 2.45, y: 1.8, z: 16.5, rotateY: -Math.PI / 2, texIndex: 6,
    title: "Casa Greyjoy",
    info: `
      Lema: "Nós Não Semeamos"
      Senhores das Ilhas de Ferro, mestres dos mares e navios.
      Membros notáveis: Balon, Theon, Yara Greyjoy.
      Curiosidade: Seguidores do Deus Afogado e cultura marítima isolada.
      Evento icônico: Rebelião Greyjoy e invasões ao continente.
    `,
    uiColor: "rgba(51,51,51,0.8)",    // cinza escuro
    textColor: "#cccccc"
  },
  { 
    x: 2.45, y: 1.8, z: 21.5, rotateY: -Math.PI / 2, texIndex: 7,
    title: "Casa Martell",
    info: `
      Lema: "Insubmissos, Não Curvados, Não Quebrados"
      Senhores de Dorne, nunca conquistados por Aegon.
      Membros notáveis: Doran, Oberyn, Ellaria Martell.
      Curiosidade: Cultura distinta e costumes de Dorne mais tolerantes.
      Evento icônico: Conflitos com Lannisters e busca por vingança de Oberyn.
    `,
    uiColor: "rgba(204,51,0,0.8)",    // vermelho queimado
    textColor: "#fff2e6"
  },
];