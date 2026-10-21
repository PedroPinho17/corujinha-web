import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidade — Corujinha",
  description:
    "Informação sobre o tratamento de dados pessoais no site do Centro de Apoio Escolar Corujinha.",
};

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="mb-6 text-sm text-muted">
        <Link href="/" className="underline hover:text-pink">
          Voltar ao início
        </Link>
      </p>

      <h1 className="font-display text-4xl text-ink md:text-5xl">Política de privacidade</h1>
      <p className="mt-3 text-sm text-muted">Última atualização: outubro de 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink/80">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">1. Responsável pelo tratamento</h2>
          <p>
            O Centro de Apoio Escolar Corujinha é responsável pelo tratamento dos dados pessoais
            recolhidos através deste site, em especial pelo formulário de inscrição / contacto.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">2. Dados tratados</h2>
          <p>
            Nome, email, telefone (opcional), mensagem e, nos pedidos de inscrição, disciplina, ano
            e polo preferido, bem como metadados técnicos necessários à segurança (ex.: endereço IP
            para limitação de pedidos abusivos).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">3. Finalidade e base legal</h2>
          <p>
            Os dados são tratados para responder ao pedido de inscrição ou contacto, com base no
            consentimento prestado no formulário (RGPD art. 6.º, n.º 1, alínea a)).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">4. Conservação</h2>
          <p>
            As mensagens do formulário de contacto / inscrição são conservadas enquanto forem
            necessárias para responder e para a gestão interna. Decorridos{" "}
            <strong>24 meses</strong> desde a criação do registo, os dados pessoais são{" "}
            <strong>anonimizados automaticamente</strong> (nome, email, telefone e conteúdo da
            mensagem deixam de identificar a pessoa). Pode pedir o apagamento antecipado a
            qualquer momento; o administrador também pode anonimizar um registo no backoffice.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">5. Direitos</h2>
          <p>
            Pode solicitar acesso, retificação, apagamento ou limitação do tratamento contactando
            o email indicado na página de contactos do site.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">6. Destinatários</h2>
          <p>
            Os dados não são vendidos. Podem ser processados por prestadores técnicos (alojamento,
            email transacional, armazenamento de ficheiros) sob contrato e apenas para operar o
            site.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">7. Contacto</h2>
          <p>
            Questões sobre privacidade: use o formulário em{" "}
            <Link href="/#contact" className="underline hover:text-pink">
              /#contact
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
