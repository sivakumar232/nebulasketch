import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AuthCanvas from "./AuthCanvas";

export default async function AuthCanvasPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token) {
        redirect("/canvas/guest");
    }

    return <AuthCanvas />;
}
