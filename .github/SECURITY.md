# Security Policy

## Reporting a Vulnerability

**Do not open a public issue** if you discover a security vulnerability. Your responsible disclosure helps protect our users.

### How to Report

1. **Send an email** to: `ikhunsa@proton.me`
   - Describe the vulnerability in detail
   - Include steps to reproduce
   - Explain potential impact on users
   - Suggest a fix if you have one

2. **Alternative**: GitHub Security Advisory
   - Navigate to `Security` → `Report a vulnerability` in the repository
   - Provide similar details to the email

3. **Keep it confidential** until:
   - You receive acknowledgment
   - A patch is released
   - Users are notified

### Expected Response

- Acknowledgment within 48 hours
- Initial assessment within 1 week
- Action plan within 2 weeks
- Patch available within 30 days (depending on severity)

## Known Vulnerabilities

We regularly check for vulnerabilities:
```bash
npm audit
npm run check:security
```

Known issues are documented in the repository.

## Security in Code

### Principles

1. **Data Transparency**
   - All external data sources are attributed
   - No hidden tracking or data collection
   - Privacy by default

2. **Input Validation**
   - All user input is validated on the backend
   - XSS protection in place
   - Rate limiting on public endpoints

3. **Secret Management**
   - Environment variables for credentials
   - `.env` files never committed
   - Regular token rotation

4. **Dependencies**
   - Regular library audits
   - Security patches applied promptly
   - Minimal unnecessary dependencies

### Before Pushing Code

```bash
npm run lint
npm run build
npm run check:security

# Check for committed secrets
git diff --cached | grep -i "password\|secret\|token\|key"
```

## Secure Deployment

- Secrets stored in platform secret manager (not in code)
- HTTPS required in production
- Content Security Policy configured
- Security headers applied
- Rate limiting enabled

## Security Audits

- Annual third-party audits
- Monthly dependency reviews
- Automated security testing in CI/CD

## User Data Security

- No personal data stored without consent
- No sharing with third parties
- GDPR and privacy law compliance
- Clear privacy policy

## Browser Support

We support modern browsers with HTTPS. Older versions may have known vulnerabilities.

## Previous Security Reports

[To be filled with project security history]

## External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [React Security](https://react.dev/learn#security)

## Contact

- **Security Issues**: ikhunsa@proton.me (for sensitive vulnerabilities)
- **Discord Community**: https://discord.gg/67GKKyqwyh (for general discussion and collaboration)

---

Thank you for helping keep Satoshi Dashboard secure! 🔒
