import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface UserApprovedEmailProps {
  userName: string | null | undefined;
  appUrl: string;
}

export const UserApprovedEmail = ({
  userName,
  appUrl,
}: UserApprovedEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Wind sniff Account is Approved!</Preview>
    <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' }}>
      <Container style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e6ebf1', borderRadius: '5px', margin: '40px auto', maxWidth: '600px' }}>
        <Heading style={{ color: '#333', fontSize: '24px' }}>Welcome to Wind sniff!</Heading>
        <Text style={{ color: '#555', fontSize: '16px', lineHeight: '1.5' }}>
          Hi {userName || 'there'},
        </Text>
        <Text style={{ color: '#555', fontSize: '16px', lineHeight: '1.5' }}>
          Great news! Your account has been approved by an administrator. You can now log in and start using the app to track wind conditions at your favorite spots.
        </Text>
        <Button href={appUrl} style={{ backgroundColor: '#007bff', color: '#ffffff', padding: '12px 20px', borderRadius: '5px', textDecoration: 'none', display: 'inline-block', marginTop: '10px' }}>
          Go to the App
        </Button>
      </Container>
    </Body>
  </Html>
);

export default UserApprovedEmail;