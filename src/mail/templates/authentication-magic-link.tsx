import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import tailwindConfig from "../../tailwind.email.config";

export interface AuthenticationMagicLinkTemplateProps {
  userEmail: string;
  authLink: string;
  appName?: string;
  expiresInMinutes?: number;
}

export function AuthenticationMagicLinkTemplate({
  userEmail,
  authLink,
  appName = "Pizza Shop",
  expiresInMinutes = 15,
}: AuthenticationMagicLinkTemplateProps) {
  const previewText = `Faça login na ${appName}`;

  return (
    <Html lang="pt-BR">
      <Preview>{previewText}</Preview>

      {/* O Head PRECISA ser descendente de <Tailwind> */}
      <Tailwind config={tailwindConfig}>
        <Head />
        <Body className="bg-white my-0 mx-auto font-sans text-black">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-5 w-[465px] max-w-full">
            <Section className="mt-8 text-center">
              <span className="text-2xl">🍕</span>
            </Section>

            <Heading className="text-black text-[24px] leading-7 font-normal text-center p-0 my-[30px] mx-0">
              Faça login na {appName}
            </Heading>

            <Text className="text-[14px] leading-[24px]">
              Você solicitou um link para login na {appName} através do e-mail{" "}
              <strong>{userEmail}</strong>.
            </Text>

            <Text className="text-[14px] leading-[24px]">
              Este link expira em <strong>{expiresInMinutes} minuto(s)</strong>.
            </Text>

            <Section className="text-center mt-8 mb-8">
              <Button
                className="bg-sky-500 hover:bg-sky-600 rounded text-white px-5 py-3 text-[12px] font-semibold no-underline text-center"
                href={authLink}
              >
                Entrar agora
              </Button>
            </Section>

            <Text className="text-[14px] leading-[24px]">
              ou copie a URL abaixo e cole em seu navegador:{" "}
              <Link
                href={authLink}
                className="text-sky-500 no-underline break-all"
              >
                {authLink}
              </Link>
            </Text>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Se você não solicitou esse link de autenticação, apenas descarte
              este e-mail.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default AuthenticationMagicLinkTemplate;
