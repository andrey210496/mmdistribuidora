import Link from "next/link";
import { LegalLayout } from "@/components/storefront/LegalLayout";
import { COMPANY } from "@/lib/company";

export const metadata = {
  title: "Trocas e Reembolsos",
  description:
    "Política de trocas, devoluções e reembolsos da MM Distribuidora — prazos, condições e como solicitar.",
};

export default function TrocasReembolsosPage() {
  return (
    <LegalLayout
      title="Política de Trocas e Reembolsos"
      subtitle="Prazos, condições e como solicitar a troca ou a devolução do seu pedido."
      updatedAt={COMPANY.policiesUpdatedAt}
    >
      <p>
        Queremos que você compre com tranquilidade. Esta política, da{" "}
        <strong>{COMPANY.name}</strong> (CNPJ {COMPANY.cnpj}), explica como funcionam as trocas,
        devoluções e reembolsos, respeitando o Código de Defesa do Consumidor (CDC).
      </p>

      <h2>1. Arrependimento em até 7 dias (compras online)</h2>
      <p>
        Se você é <strong>consumidor final</strong>, tem o direito de se arrepender da compra em até{" "}
        <strong>7 dias corridos</strong> após o recebimento, conforme o art. 49 do CDC — sem precisar
        justificar. Nesse caso, o <strong>reembolso é integral</strong>, incluindo o valor do frete.
        O produto deve ser devolvido em perfeito estado, preferencialmente na embalagem original.
      </p>

      <h2>2. Produto com defeito, avaria ou divergência</h2>
      <p>
        Se o produto chegar com defeito, avariado ou diferente do pedido, fale com a gente em até{" "}
        <strong>7 dias</strong> após o recebimento. Faremos a troca ou o reembolso integral, sem custo
        para você. Ajuda muito se você enviar fotos do item e da embalagem.
      </p>

      <h2>3. Produtos alimentícios</h2>
      <p>
        Por se tratar de <strong>alimentos</strong>, por segurança e higiene, só aceitamos troca ou
        devolução de itens <strong>lacrados e dentro do prazo de validade</strong>, salvo nos casos de
        defeito, avaria ou divergência descritos acima. Itens perecíveis abertos não podem ser
        devolvidos por arrependimento.
      </p>

      <h2>4. Como solicitar</h2>
      <ul>
        <li>Entre em contato pela página de <Link href="/contato">contato</Link> ou pelo e-mail <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>;</li>
        <li>Informe o número do pedido e o motivo;</li>
        <li>Combinaremos com você a forma de devolução e o reembolso.</li>
      </ul>

      <h2>5. Como e quando o reembolso é feito</h2>
      <p>
        O reembolso é devolvido pelo <strong>mesmo meio de pagamento</strong> usado na compra (estorno
        no cartão ou no PIX, via Stripe). O valor costuma aparecer na sua fatura ou conta em até{" "}
        <strong>5 a 10 dias úteis</strong>, podendo variar conforme o seu banco ou a operadora do cartão
        (em alguns casos, na fatura seguinte).
      </p>

      <h2>6. Compras para revenda (pessoa jurídica)</h2>
      <p>
        As regras de arrependimento dos itens 1 a 3 protegem o <strong>consumidor final</strong>. Para
        compras feitas por <strong>revendedores ou empresas (B2B)</strong>, em casos de{" "}
        <strong>cancelamento por conveniência</strong> (sem defeito do produto), poderá haver retenção
        da <strong>taxa de processamento de pagamento</strong> cobrada pela operadora, que não é
        devolvida no estorno. Esse valor, quando aplicável, é informado no momento do cancelamento.
      </p>

      <h2>7. Dúvidas</h2>
      <p>
        Ficou com alguma dúvida? Fale com a gente pela página de <Link href="/contato">contato</Link>{" "}
        ou pelo e-mail <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. Estamos por aqui pra ajudar. 💛
      </p>
    </LegalLayout>
  );
}
