import Link from "next/link";
import { LegalLayout } from "@/components/storefront/LegalLayout";
import { COMPANY } from "@/lib/company";

export const metadata = {
  title: "Termos de Uso",
  description:
    "Termos e condições de uso do site e das compras na Doce Encanto.",
};

export default function TermosPage() {
  return (
    <LegalLayout
      title="Termos de Uso"
      subtitle="As condições para usar o nosso site e comprar na Doce Encanto."
      updatedAt={COMPANY.policiesUpdatedAt}
    >
      <p>
        Estes Termos regem o uso do site <a href={COMPANY.url}>{COMPANY.site}</a> e as compras
        realizadas junto à <strong>{COMPANY.name}</strong> ({COMPANY.legalName}), CNPJ{" "}
        <strong>{COMPANY.cnpj}</strong>. Ao navegar ou comprar, você concorda com estas condições.
      </p>

      <h2>1. Sobre nós</h2>
      <p>
        A {COMPANY.name} é uma distribuidora de doces, chocolates e embalagens para confeitaria,
        atendendo o {COMPANY.region}.
      </p>

      <h2>2. Cadastro e conta</h2>
      <p>
        Para comprar, você cria uma conta com dados verdadeiros e mantém a sua senha em sigilo.
        Você é responsável pela atividade realizada na sua conta. O tratamento dos seus dados segue
        a nossa <Link href="/politica-de-privacidade">Política de Privacidade</Link>.
      </p>

      <h2>3. Produtos, preços e disponibilidade</h2>
      <p>
        Trabalhamos para manter as informações de produtos e preços corretas, mas podem ocorrer
        erros ou alterações. Os preços e a disponibilidade podem mudar sem aviso prévio, e o valor
        válido é o exibido no momento da finalização do pedido. Imagens são meramente ilustrativas.
      </p>

      <h2>4. Pedidos e pagamento</h2>
      <p>
        O pagamento é processado de forma segura pela <strong>Stripe</strong> (cartão de crédito ou
        PIX). O pedido é confirmado somente após a aprovação do pagamento. Por segurança, todos os
        valores são recalculados e validados no nosso servidor — nenhum preço é aceito a partir do
        navegador. Reservamo-nos o direito de cancelar pedidos com suspeita de fraude ou erro evidente de preço.
      </p>

      <h2>5. Clube Doce Encanto</h2>
      <p>
        O <Link href="/clube">Clube Doce Encanto</Link> é uma assinatura <strong>anual</strong> que dá
        acesso a preços exclusivos de membro durante 12 meses. Os preços de membro só são aplicados
        para clientes com assinatura ativa, validados no servidor. A renovação e as condições são
        informadas na página do Clube.
      </p>

      <h2>6. Entrega</h2>
      <p>
        Realizamos entregas na nossa região de atuação ({COMPANY.region}). Prazos e valores de frete
        são informados no momento da compra, conforme o endereço de entrega.
      </p>

      <h2>7. Cancelamento, trocas e reembolsos</h2>
      <p>
        As regras de cancelamento, troca e devolução estão na nossa{" "}
        <Link href="/trocas-e-reembolsos">Política de Trocas e Reembolsos</Link>, que faz parte
        destes Termos.
      </p>

      <h2>8. Uso aceitável</h2>
      <p>
        Você concorda em não usar o site para fins ilícitos, não tentar burlar preços ou regras, não
        acessar áreas restritas sem autorização e não prejudicar o funcionamento do serviço.
      </p>

      <h2>9. Propriedade intelectual</h2>
      <p>
        A marca, o logotipo, os textos e as imagens do site pertencem à {COMPANY.name} ou aos seus
        fornecedores e não podem ser usados sem autorização.
      </p>

      <h2>10. Alterações e foro</h2>
      <p>
        Podemos atualizar estes Termos a qualquer momento; a data da última revisão consta no topo
        da página. Eventuais questões serão regidas pela legislação brasileira, especialmente o
        Código de Defesa do Consumidor.
      </p>
    </LegalLayout>
  );
}
