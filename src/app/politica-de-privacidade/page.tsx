import Link from "next/link";
import { LegalLayout } from "@/components/storefront/LegalLayout";
import { COMPANY } from "@/lib/company";

export const metadata = {
  title: "Política de Privacidade",
  description:
    "Como a MM Distribuidora coleta, usa e protege os seus dados pessoais, em conformidade com a LGPD.",
};

export default function PoliticaPrivacidadePage() {
  return (
    <LegalLayout
      title="Política de Privacidade"
      subtitle="Como tratamos e protegemos os seus dados pessoais, em conformidade com a LGPD (Lei nº 13.709/2018)."
      updatedAt={COMPANY.policiesUpdatedAt}
    >
      <p>
        Esta Política explica como a <strong>{COMPANY.name}</strong> ({COMPANY.legalName}),
        inscrita no CNPJ <strong>{COMPANY.cnpj}</strong>, responsável pelo site{" "}
        <a href={COMPANY.url}>{COMPANY.site}</a>, coleta, utiliza, armazena e protege as
        informações pessoais dos seus clientes e visitantes. Ao usar nosso site, você
        concorda com as práticas aqui descritas.
      </p>

      <h2>1. Quem é o responsável pelos seus dados</h2>
      <p>
        O controlador dos dados é a <strong>{COMPANY.name}</strong> (CNPJ {COMPANY.cnpj}).
        Para qualquer assunto relacionado à privacidade, fale com a gente pelo e-mail{" "}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> ou pela página de{" "}
        <Link href="/contato">contato</Link>.
      </p>

      <h2>2. Quais dados coletamos</h2>
      <ul>
        <li><strong>Cadastro:</strong> nome, CPF ou CNPJ, telefone e, opcionalmente, e-mail.</li>
        <li><strong>Entrega:</strong> endereço (CEP, rua, número, bairro, cidade e estado).</li>
        <li><strong>Pedidos:</strong> itens comprados, valores, histórico e status.</li>
        <li><strong>Acesso:</strong> dados técnicos mínimos para manter o login e a segurança da sessão.</li>
      </ul>
      <p>
        <strong>Não armazenamos dados de cartão de crédito.</strong> O pagamento é processado
        diretamente pela <strong>Stripe</strong>, uma plataforma de pagamento segura — os dados
        do cartão são digitados em ambiente da própria Stripe e nunca passam pelos nossos servidores.
      </p>

      <h2>3. Para que usamos os seus dados</h2>
      <ul>
        <li>Processar e entregar os seus pedidos;</li>
        <li>Identificar você na sua conta e aplicar os preços do Clube (quando for membro);</li>
        <li>Prestar atendimento e suporte;</li>
        <li>Cumprir obrigações legais e fiscais (ex.: emissão de nota fiscal);</li>
        <li>Prevenir fraudes e garantir a segurança das transações.</li>
      </ul>
      <p>
        As bases legais (LGPD, art. 7º) são, conforme o caso: a <strong>execução do contrato</strong>{" "}
        de compra, o <strong>cumprimento de obrigação legal</strong> e o <strong>legítimo
        interesse</strong> em prevenir fraudes.
      </p>

      <h2>4. Com quem compartilhamos</h2>
      <p>Compartilhamos o mínimo necessário, apenas com:</p>
      <ul>
        <li><strong>Stripe</strong> — para processar o pagamento;</li>
        <li><strong>Transportadoras/entregadores</strong> — para entregar o pedido;</li>
        <li><strong>Autoridades</strong> — quando exigido por lei ou ordem judicial.</li>
      </ul>
      <p><strong>Nunca vendemos os seus dados</strong> nem os repassamos para fins de marketing de terceiros.</p>

      <h2>5. Cookies</h2>
      <p>
        Usamos <strong>apenas cookies estritamente necessários</strong> para o site funcionar —
        não usamos cookies de publicidade, rastreamento ou redes sociais. São eles:
      </p>
      <ul>
        <li><strong>Cookie de sessão do cliente</strong> — mantém o seu login, o seu carrinho e o CEP do frete. Validade de até 30 dias.</li>
        <li><strong>Cookie de sessão administrativa</strong> — usado apenas pela equipe interna para acessar o painel.</li>
      </ul>
      <p>
        Esses cookies são criptografados, protegidos contra acesso por scripts
        (<em>httpOnly</em>) e essenciais: sem eles, não é possível fazer login, manter o carrinho
        ou finalizar a compra. Por serem necessários ao serviço, dispensam consentimento prévio.
        Você pode bloqueá-los nas configurações do navegador, mas algumas funções deixarão de funcionar.
      </p>

      <h2>6. Os seus direitos (LGPD)</h2>
      <p>A qualquer momento, você pode solicitar:</p>
      <ul>
        <li>Confirmação de que tratamos os seus dados e acesso a eles;</li>
        <li>Correção de dados incompletos ou desatualizados;</li>
        <li>Exclusão ou anonimização dos seus dados, quando aplicável;</li>
        <li>Portabilidade e informação sobre compartilhamentos.</li>
      </ul>
      <p>
        Para exercer qualquer direito, escreva para{" "}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. Alguns dados podem ser mantidos
        mesmo após a solicitação, quando houver obrigação legal (ex.: registros fiscais).
      </p>

      <h2>7. Segurança e retenção</h2>
      <p>
        Adotamos medidas de segurança como criptografia, senhas protegidas por <em>hash</em> e
        validação de todas as transações no servidor. Mantemos os seus dados pelo tempo necessário
        para cumprir as finalidades acima e as obrigações legais, descartando-os com segurança quando não forem mais necessários.
      </p>

      <h2>8. Alterações desta Política</h2>
      <p>
        Podemos atualizar esta Política periodicamente. A data da última revisão é sempre indicada
        no topo desta página. Mudanças relevantes serão comunicadas pelos nossos canais.
      </p>
    </LegalLayout>
  );
}
