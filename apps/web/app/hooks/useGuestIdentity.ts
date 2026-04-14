import { useSharedIdentity } from "../providers/IdentityContext";

export function useGuestIdentity() {
    return useSharedIdentity();
}
