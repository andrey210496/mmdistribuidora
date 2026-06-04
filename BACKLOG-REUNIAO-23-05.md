# Backlog — Reunião 23/05/2026 (Andrey ↔ Renan & Brenda)

Pontos levantados na reunião de apresentação do sistema. Status inicial.

## 🔧 AJUSTES no que já existe

| # | Item | Detalhe | Esforço |
|---|------|---------|---------|
| 1 | Header/banner do Clube fixo | Reduzir tamanho — ficou grande/cortado em tela de notebook. Manter fixo ao rolar. | Baixo |
| 2 | Remover "Ofertas da semana" | Promoção será **só via clube**. Tirar a seção da home. | Baixo |
| 3 | "Produtos em destaque" → vira vitrine do Clube | Cada dia produtos diferentes (próximos do vencimento / comprados barato). Mostrar **preço normal** + **preço clube**. | Médio |
| 4 | Botão "Emitir NF" | Cliente quer NF emitida **no momento do pagamento** (vai p/ e-mail + impressa). Ajustar fluxo. ⚠️ ver ponto fiscal. | Médio |
| 5 | "Acabou de chegar" | Manter — puxa por data de cadastro. OK. | — |
| 6 | Impressão de pedido | Cliente **prefere imprimir** (funcionária separa pelo papel). QR/tela interativa = opção secundária p/ terceiros. Já existe. | OK |
| 7 | Cancelar pedido | Confirmação + motivo. Já existe. OK. | OK |

## 🆕 FEATURES novas a desenvolver

| # | Item | Detalhe | Esforço |
|---|------|---------|---------|
| 8 | Campo **Data de validade** no produto | Adicionar no cadastro de produto. | Baixo |
| 9 | Automação "próximos do vencimento" | Sistema puxa automático produtos perto de vencer p/ vitrine do clube. | Médio |
| 10 | **Clube de Vantagens** (dinâmica definida) | Cadastro pago **único** (~R$19,90 simbólico), **SEM mensalidade**, **SEM cashback agora**. Produto do clube tem preço normal vs preço clube. Produtos definidos manualmente. | Alto |
| 11 | Sistema de **pontos** (futuro) | Compra gera pontos → troca por produtos (ex: 300pts = chocolate 1kg). Preferível ao cashback. Fase posterior. | Alto (depois) |
| 12 | **Perfis de acesso / equipe** | Roles: Separadora (só impressão/status/estoque, SEM valores), Gerente (amplo), Admin. Cada um com login próprio. Banco já tem ADMIN/PICKER/FINANCE. Falta UI + telas respeitando permissão. | Alto |
| 13 | **Multi-login** | Logar em ~3 lugares (galpão, venda, etc). Liberar sessão em múltiplos dispositivos. | Baixo |
| 14 | **Notificação WhatsApp** | Avisar cliente quando "saiu para entrega" (via WhatsApp, não e-mail). | Médio (depende API) |
| 15 | **Cálculo de frete** | Por CEP/quilometragem, múltiplas opções (transportadora/Sedex) com prazos. Regras configuráveis. ⏳ aguarda cliente trazer parcerias/valores. | Alto |
| 16 | **Financeiro** completo | Ainda não implementado. | Alto |
| 17 | **Integração WhatsApp** (API oficial) | Centralizar atendimento dentro do sistema (aba Atendimentos). Usar **API oficial** (evita ban). Sem chat humano agora — chat com auto-resposta direcionando p/ WhatsApp. | Alto |

## ⚠️ PONTOS DE ATENÇÃO / DECISÕES

| # | Item | Observação |
|---|------|------------|
| 18 | **NF-e real (fiscal)** | Cliente TEM certificado digital. Emissão automática de NF-e exige integração com SEFAZ (certificado A1, NCM, CFOP, regime tributário) — é um módulo fiscal à parte (Focus NFe / NFe.io, com mensalidade). Hoje o sistema gera só comprovante interno. **Precisa decidir provedor fiscal.** |
| 19 | **WhatsApp API oficial** | Mais seguro (Meta está banindo não-oficial). Janela de 24h, templates aprovados p/ disparo fora da janela. Custo é centavos. Precisa conexão (codigozinho). |
| 20 | **Atendimento** | Tudo direcionado p/ WhatsApp único da Doce Encanto. |

## 📋 PENDÊNCIAS DO CLIENTE (eles precisam fornecer)

- [ ] Definir **opções de menu/categorias** finais
- [ ] Trazer **parcerias de frete** (transportadoras, valores, prazos, regras)
- [ ] Confirmar **valor de entrada do clube** (sugerido R$19,90)
- [ ] Decidir **provedor de NF-e** (ou manter comprovante interno por ora)
- [ ] Fornecer **dados fiscais reais** (CNPJ, IE, endereço) p/ NF e rodapé
- [ ] WhatsApp oficial da loja p/ integração

## ✅ JÁ ENTREGUE (mencionado na reunião)

- Logo aplicada (era placeholder DE na reunião → já trocada)
- Site no ar com domínio + SSL
- Estrutura visual / paleta aprovada ("cores estão legais, Brenda gostou")
- Carrinho, checkout, pedido, separação (QR + impressão), dashboard, CRUD produtos/categorias/clientes
