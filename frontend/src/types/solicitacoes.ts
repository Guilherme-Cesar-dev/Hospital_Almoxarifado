export type Solicitacao = {
  id_solicitacao: number;
  titulo: string;
  descricao: string;
  setor: string;
  estado: string;
  quando: string;
};

export type SolicitacaoListResponse = {
  ok: true;
  count?: number | null;
  data: Solicitacao[];
};

export type SolicitacaoDetalheResponse = {
  ok: true;
  data: {
    solicitacao: {
      id_solicitacao: number;
      titulo: string;
      descricao: string;
      setor: string;
      estado: string;
      solicitante_user_id: string;
      quando: string;
      concluida_por: string | null;
      concluida_em: string | null;
      atendimento_resumo: unknown | null;
    };
    itens: Array<{
      id_solicitacao_item: number;
      id_item: number;
      quantidade: number;
      quantidade_aprovada: number | null;
      observacao: string | null;
      item: {
        nome: string | null;
        tipo: string | null;
        quantidade_atual: number | null;
        validade: string | null;
        estoque_minimo: string | null;
      };
    }>;
  };
};

export type CreateSolicitacaoBody = {
  titulo: string;
  descricao: string;
  setor: string;
};

export type CreateSolicitacaoResponse = {
  ok: true;
  data: {
    id_solicitacao: number;
    titulo: string;
    descricao: string;
    setor: string;
    estado: string;
    solicitante_user_id: string;
    quando: string;
  };
};

export type AddItemBody = {
  id_item: number;
  quantidade: number;
  observacao?: string;
};

export type AddItemResponse = {
  ok: true;
  data: unknown;
};

export type AtenderResponse = {
  ok: true;
  id_solicitacao: number;
  movimentacoes: unknown;
};