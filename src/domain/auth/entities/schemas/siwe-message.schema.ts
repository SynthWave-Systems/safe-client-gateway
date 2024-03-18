import { getAddress } from 'viem';
import { z } from 'zod';

/**
 * The following adheres to the EIP-4361 (SiWe) standard, catered to this project.
 * {@link https://eips.ethereum.org/EIPS/eip-4361}
 */
export const SiweMessageSchema = z.object({
  /**
   * OPTIONAL. The URI scheme of the origin of the request. Its value MUST be an RFC 3986 URI scheme.
   */
  scheme: z
    // Valid RFC 3986 URI schemes that suit our needs
    .enum(['http', 'https'])
    .optional(),
  /**
   * REQUIRED. The domain that is requesting the signing. Its value MUST be an RFC 3986 authority. The authority includes
   * an OPTIONAL port. If the port is not specified, the default port for the provided scheme is assumed (e.g., 443 for HTTPS).
   * If scheme is not specified, HTTPS is assumed by default.
   */
  domain: z.string().refine((domain) => {
    return (
      URL.canParse(`scheme://${domain}`) &&
      // Duplicate schemes are otherwise deemed valid, e.g. https://https://example.com
      !domain.includes('://')
    );
  }),
  /**
   * REQUIRED. The Ethereum address performing the signing. Its value SHOULD be conformant to mixed-case checksum address
   * encoding specified in ERC-55 where applicable.
   */
  address: z.string().refine((value): value is `0x${string}` => {
    try {
      // Ensure address is checksummed
      return value === getAddress(value);
    } catch {
      return false;
    }
  }),
  /**
   * OPTIONAL. A human-readable ASCII assertion that the user will sign which MUST NOT include '\n' (the byte 0x0a).
   */
  statement: z
    .string()
    .optional()
    .refine((value) => !value?.includes('\n')),
  /**
   * REQUIRED. An RFC 3986 URI referring to the resource that is the subject of the signing (as in the subject of a claim).
   */
  uri: z.string().url(),
  /**
   * REQUIRED. The current version of the SIWE Message, which MUST be 1 for this specification.
   */
  version: z.literal('1'),
  /**
   * REQUIRED. The EIP-155 Chain ID to which the session is bound, and the network where Contract Accounts MUST be resolved.
   */
  chainId: z.coerce.number().int(),
  /**
   * REQUIRED. A random string typically chosen by the relying party and used to prevent replay attacks, at least 8 alphanumeric
   * characters.
   */
  nonce: z
    .string()
    .min(8)
    .regex(/^[a-zA-Z0-9]+$/),
  /**
   * REQUIRED. The time when the message was generated, typically the current time. Its value MUST be an ISO 8601 datetime string.
   */
  issuedAt: z
    .string()
    .datetime()
    .optional()
    .default(() => new Date().toISOString()),
  /**
   * OPTIONAL. The time when the signed authentication message is no longer valid. Its value MUST be an ISO 8601 datetime string.
   */
  expirationTime: z.string().datetime().optional(),
  /**
   * OPTIONAL. The time when the signed authentication message will become valid. Its value MUST be an ISO 8601 datetime string.
   */
  notBefore: z.string().datetime().optional(),
  /**
   * OPTIONAL. A system-specific identifier that MAY be used to uniquely refer to the sign-in request.
   */
  requestId: z.string().optional(),
  /**
   * OPTIONAL. A list of information or references to information the user wishes to have resolved as part of authentication by the
   * relying party. Every resource MUST be an RFC 3986 URI separated by "\n- " where \n is the byte 0x0a.
   */
  resources: z
    .array(
      z
        .string()
        .url()
        .refine((value) => !value?.includes('\n')),
    )
    .optional(),
});
