import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Onbord'

interface InterviewInvitationProps {
  candidateFirstName?: string
  jobTitle?: string
  companyName?: string
  interviewUrl?: string
  estimatedMinutes?: number
}

const InterviewInvitationEmail = ({
  candidateFirstName,
  jobTitle,
  companyName,
  interviewUrl,
  estimatedMinutes = 10,
}: InterviewInvitationProps) => {
  const greeting = candidateFirstName ? `Bonjour ${candidateFirstName},` : 'Bonjour,'
  const role = jobTitle || 'le poste'
  const company = companyName || 'l\'entreprise'

  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Votre entretien IA pour {role} chez {company}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={brand}>{SITE_NAME}</Heading>

          <Heading style={h1}>{greeting}</Heading>

          <Text style={text}>
            {company} a retenu votre profil pour <strong>{role}</strong> et vous invite à un court
            entretien préliminaire mené par notre IA.
          </Text>

          <Text style={text}>
            L'entretien se fait par chat, dure environ <strong>{estimatedMinutes} minutes</strong>,
            et porte sur votre motivation, votre expérience et votre adéquation au poste.
          </Text>

          <Section style={buttonSection}>
            <Button style={button} href={interviewUrl}>
              Démarrer mon entretien
            </Button>
          </Section>

          <Text style={smallText}>
            Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :
            <br />
            <Link href={interviewUrl} style={link}>{interviewUrl}</Link>
          </Text>

          <Text style={footer}>
            Ce lien est personnel et ne doit pas être partagé. Il expire dans 14 jours.
            <br />
            — L'équipe {SITE_NAME}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: InterviewInvitationEmail,
  subject: (data: Record<string, any>) =>
    data.jobTitle
      ? `Entretien préliminaire pour ${data.jobTitle}`
      : 'Votre entretien préliminaire',
  displayName: 'Invitation entretien IA',
  previewData: {
    candidateFirstName: 'Marie',
    jobTitle: 'Développeur Full-Stack',
    companyName: 'Acme',
    interviewUrl: 'https://app.onbord.be/interview/example-token',
    estimatedMinutes: 10,
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Onest', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 28px',
}
const brand = {
  fontSize: '14px',
  fontWeight: '700' as const,
  color: '#0B2447',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  margin: '0 0 32px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: '600' as const,
  color: '#0B2447',
  margin: '0 0 20px',
  lineHeight: '1.3',
}
const text = {
  fontSize: '15px',
  color: '#1f2937',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const buttonSection = {
  margin: '32px 0',
  textAlign: 'center' as const,
}
const button = {
  backgroundColor: '#0B2447',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  padding: '14px 28px',
  borderRadius: '10px',
  textDecoration: 'none',
  display: 'inline-block',
}
const smallText = {
  fontSize: '13px',
  color: '#6b7280',
  lineHeight: '1.5',
  margin: '24px 0 0',
}
const link = {
  color: '#0B2447',
  wordBreak: 'break-all' as const,
}
const footer = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '32px 0 0',
  lineHeight: '1.5',
}
