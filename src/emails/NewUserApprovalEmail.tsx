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

interface NewUserEmailProps {
  newUserName: string | null | undefined;
  newUserEmail: string;
  adminDashboardUrl: string;
  signupDate: Date;
}

export const NewUserApprovalEmail = ({
  newUserName,
  newUserEmail,
  adminDashboardUrl,
  signupDate,
}: NewUserEmailProps) => (
  <Html>
    <Head />
    <Preview>New User Awaiting Approval</Preview>
    <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' }}>
      <Container style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e6ebf1', borderRadius: '5px', margin: '40px auto', maxWidth: '600px' }}>
        <Heading style={{ color: '#333', fontSize: '24px' }}>New User Sign-Up</Heading>
        <Text style={{ color: '#555', fontSize: '16px', lineHeight: '1.5' }}>
          A new user has signed up for Wind sniff and is awaiting your approval.
        </Text>
        {newUserName && (
          <Text style={{ color: '#555', fontSize: '16px', lineHeight: '1.5' }}>
            <strong>Name:</strong> {newUserName}
          </Text>
        )}
        <Text style={{ color: '#555', fontSize: '16px', lineHeight: '1.5' }}>
          <strong>Email:</strong> {newUserEmail}
        </Text>
        <Text style={{ color: '#555', fontSize: '16px', lineHeight: '1.5' }}>
          <strong>Time:</strong> {signupDate.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}
        </Text>
        <Button href={adminDashboardUrl} style={{ backgroundColor: '#007bff', color: '#ffffff', padding: '12px 20px', borderRadius: '5px', textDecoration: 'none', display: 'inline-block', marginTop: '10px' }}>
          Go to Admin Dashboard
        </Button>
      </Container>
    </Body>
  </Html>
);

export default NewUserApprovalEmail;