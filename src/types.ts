// src/types.ts

export interface Course {
  id: string;

  // Campos básicos
  name: string;
  slug: string;
  type: "presencial" | "ead";

  // Textos
  duration: string;
  description: string;
  shortDescription: string; // short_descript no banco

  // Arrays JSON
  content: string[];
  benefits: string[];

  // Preços
  price: number;
  promoPrice: number | null; // promo_price no banco

  // Imagem
  imageUrl: string; // image no banco

  // Flags
  active: boolean; // active
  isFeatured: boolean; // featured

  // Só usado no front, não existe no banco
  workload?: string;
  
}

export interface Banner {
  id: string;
  titulo?: string;
  imagem_url: string;
  ativo: boolean;
  ordem: number;
}

// 🟩 NOVA INTERFACE: Leads de Contato do WhatsApp
export interface Lead {
    id: string;
    nome: string;
    telefone: string;
    curso_interesse: string;
    horario_interesse: string;
    data_registro: string; // TIMESTAMP do Supabase
    contatado: boolean; // Flag para o admin marcar se já houve contato
}