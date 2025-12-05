import { useSessionStore, SessionIdentity } from "../../stores/session.store";
import { InfoField } from "./InfoField";
import { ProfileSection } from "./ProfileSection";
import { UserTraits } from "../../types/user";

export function ProfileInfo() {
  const session = useSessionStore((state) => state.session);
  const identity = session?.identity as SessionIdentity | undefined;
  const traits = identity?.traits as unknown as UserTraits;

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <ProfileSection title="Personal Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoField
            label="First Name"
            value={traits?.name?.first || "N/A"}
          />
          <InfoField
            label="Last Name"
            value={traits?.name?.last || "N/A"}
          />
          <InfoField
            label="Email Address"
            value={traits?.email || "N/A"}
            verified={true} // Assuming verified for now, or check verifiable_addresses
            className="md:col-span-2"
          />
          <InfoField
            label="Phone Number"
            value={traits?.phone || "(629) 555-0129"}
            verified={true}
            className="md:col-span-2"
          />
        </div>
      </ProfileSection>

      {/* Social Media Account */}
      <ProfileSection
        title="Social Media Account"
        action={
          <button className="px-4 py-2 bg-foxia-600 hover:bg-foxia-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>
            Add Social Media
          </button>
        }
      >
        <div className="space-y-4">
          <InfoField
            label="Facebook"
            value="https://www.facebook.com/comeronw"
          />
          <InfoField
            label="Instagram"
            value="https://www.instagram.com/comeronw"
          />
        </div>
      </ProfileSection>

      {/* Other */}
      <ProfileSection title="Other">
        <div className="space-y-4">
          <InfoField
            label="Web3 Wallets"
            value="https://wpshout.com/"
          />
          <InfoField
            label="Enterprise Account"
            value="https://www.foxia.vn"
          />
        </div>
      </ProfileSection>
    </div>
  );
}
