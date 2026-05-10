import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";

export interface Team {
  id: string;
  name: string;
  photoURL: string | null;
  inviteCode: string;
  createdBy: string;
}

function randomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createTeam(uid: string, name: string, photo?: File): Promise<Team> {
  if (!db) throw new Error("Firebase not configured");
  const inviteCode = randomCode();
  const teamRef = doc(collection(db, "teams"));
  let photoURL = "";
  if (photo && storage) {
    const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
    const storageRef = ref(storage, `team-photos/${teamRef.id}/photo-${Date.now()}.${extension}`);
    await uploadBytes(storageRef, photo, { contentType: photo.type || "image/jpeg" });
    photoURL = await getDownloadURL(storageRef);
  }
  await setDoc(teamRef, {
    name,
    photoURL,
    inviteCode,
    createdBy: uid,
    ownerId: uid,
    memberIds: [uid],
    memberCount: 1,
    createdAt: serverTimestamp(),
  });
  await setDoc(doc(db, "users", uid), { teamId: teamRef.id, teamName: name, ...(photoURL && { teamPhotoURL: photoURL }) }, { merge: true });
  return { id: teamRef.id, name, photoURL, inviteCode, createdBy: uid };
}

export async function uploadTeamPhoto(teamId: string, photo: File): Promise<string> {
  if (!db || !storage) throw new Error("Firebase not configured");
  const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
  const storageRef = ref(storage, `team-photos/${teamId}/photo-${Date.now()}.${extension}`);
  await uploadBytes(storageRef, photo, { contentType: photo.type || "image/jpeg" });
  const url = await getDownloadURL(storageRef);
  await setDoc(doc(db, "teams", teamId), { photoURL: url }, { merge: true });
  return url;
}

export async function joinTeamByCode(uid: string, code: string): Promise<Team> {
  if (!db) throw new Error("Firebase not configured");
  const snap = await getDocs(
    query(collection(db, "teams"), where("inviteCode", "==", code.toUpperCase().trim()))
  );
  if (snap.empty) throw new Error("No team found with that code.");
  const d = snap.docs[0]!;
  const data = d.data();
  const memberCount = (data.memberCount as number | undefined) ?? 0;
  const memberIds = Array.isArray(data.memberIds) ? data.memberIds as string[] : [];
  await setDoc(d.ref, { memberCount: memberCount + 1, memberIds: Array.from(new Set([...memberIds, uid])) }, { merge: true });
  await setDoc(doc(db, "users", uid), { teamId: d.id, teamName: data.name }, { merge: true });
  return {
    id: d.id,
    name: data.name as string,
    photoURL: (data.photoURL as string | undefined) ?? "",
    inviteCode: data.inviteCode as string,
    createdBy: data.createdBy as string,
  };
}
