import {
  collection,
  doc,
  getDoc,
  increment,
  arrayUnion,
  setDoc,
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
    createdBy: uid,
    ownerId: uid,
    memberIds: [uid],
    memberCount: 1,
    createdAt: serverTimestamp(),
  });
  await setDoc(doc(db, "teamInvites", inviteCode), {
    code: inviteCode,
    teamId: teamRef.id,
    teamName: name,
    teamPhotoURL: photoURL || null,
    createdBy: uid,
    createdAt: serverTimestamp(),
    active: true,
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
  const normalized = code.toUpperCase().trim();
  const inviteSnap = await getDoc(doc(db, "teamInvites", normalized));
  if (!inviteSnap.exists() || inviteSnap.data().active === false) throw new Error("No team found with that code.");

  const invite = inviteSnap.data();
  const teamId = invite.teamId as string;
  const teamName = invite.teamName as string;
  const teamPhotoURL = (invite.teamPhotoURL as string | null | undefined) ?? null;

  await setDoc(doc(db, "teams", teamId), {
    memberIds: arrayUnion(uid),
    memberCount: increment(1),
  }, { merge: true });
  await setDoc(doc(db, "users", uid), { teamId, teamName, ...(teamPhotoURL && { teamPhotoURL }) }, { merge: true });
  return {
    id: teamId,
    name: teamName,
    photoURL: teamPhotoURL ?? "",
    inviteCode: normalized,
    createdBy: invite.createdBy as string,
  };
}
