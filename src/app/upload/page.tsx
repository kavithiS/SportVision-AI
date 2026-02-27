"use client";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SelectedFile = {
  file: File;
  url: string;
  kind: "image" | "video" | "other";
};

export default function Upload() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selected, setSelected] = useState<SelectedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [guest, setGuest] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);


  // Do NOT auto-redirect — show sign-in prompt but allow a guest mode for testing
  useEffect(() => {
    // keep present to react to status changes if needed
  }, [status]);

  useEffect(() => {
    return () => {
      // cleanup object URLs
      selected.forEach((s) => URL.revokeObjectURL(s.url));
    };
  }, [selected]);

  if (status === "loading") return <p>Loading...</p>;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const mapped: SelectedFile[] = files.map((f) => {
      const url = URL.createObjectURL(f);
      const type = f.type;
      const kind = type.startsWith("image")
        ? "image"
        : type.startsWith("video")
        ? "video"
        : "other";
      return { file: f, url, kind };
    });
    setSelected((s) => [...s, ...mapped]);
    // optionally reset input value so same file can be selected again
    e.currentTarget.value = "";
  }

  function removeFile(index: number) {
    setSelected((s) => {
      const toRemove = s[index];
      if (toRemove) URL.revokeObjectURL(toRemove.url);
      const next = [...s];
      next.splice(index, 1);
      return next;
    });
  }

  async function uploadPlaceholder() {
    if (selected.length === 0) return;
    setUploading(true);
    setUploadResult(null);
    setUploadProgress(0);
    try {
      const fd = new FormData();
      selected.forEach((s) => fd.append("files", s.file));

      // Use XHR for progress events
      const uploadWithProgress = (formData: FormData, onProgress: (p: number) => void) =>
        new Promise<any>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/upload");
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
          };
          xhr.onload = () => {
            const txt = xhr.responseText || "";
            let parsed: any = null;
            try {
              parsed = JSON.parse(txt);
            } catch (e) {
              // not JSON, fall back to raw text
              parsed = { text: txt };
            }
            if (xhr.status >= 200 && xhr.status < 300) resolve(parsed);
            else reject(parsed);
          };
          xhr.onerror = () => reject({ error: "Upload failed" });
          xhr.send(formData);
        });

      const data = await uploadWithProgress(fd, (p) => setUploadProgress(p));
      // If successful, clear selection
      if (data && data.files) {
        setSelected([]);
      }
      setUploadResult(data);
    } catch (err) {
      // If `err` is an Error instance, show its message. If it's an object (parsed JSON),
      // store it directly so UI can render structured info instead of "[object Object]".
      if (err instanceof Error) {
        setUploadResult({ error: err.message });
        alert(err.message);
      } else if (err && typeof err === "object") {
        setUploadResult(err);
        try {
          alert(JSON.stringify(err, null, 2));
        } catch {
          alert(String(err));
        }
      } else {
        const msg = String(err);
        setUploadResult({ error: msg });
        alert(msg);
      }
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-4xl font-bold">Upload Files</h1>

      {/* If unauthenticated and not in guest mode, show sign-in CTA */}
      {status === "unauthenticated" && !guest ? (
        <div className="max-w-md text-center">
          <p className="mb-4">You must sign in to upload files.</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => signIn()}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Sign in
            </button>
            <button
              onClick={() => setGuest(true)}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Continue as guest
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600">{status === 'authenticated' ? `Signed in as ${session?.user?.email}` : 'Guest mode — uploads are local only.'}</p>

          <div className="w-full max-w-2xl mt-4">
            <label className="block mb-2">Select files to upload</label>
            <input
              type="file"
              multiple
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />

            {selected.length > 0 && (
              <section className="mt-4 space-y-4">
                <h2 className="font-semibold">Selected files ({selected.length})</h2>
                <ul className="space-y-2">
                  {selected.map((s, i) => (
                    <li key={s.url} className="flex items-start gap-4">
                      <div className="w-28 h-20 bg-gray-100 flex items-center justify-center overflow-hidden rounded">
                        {s.kind === "image" ? (
                          <img src={s.url} alt={s.file.name} className="object-cover w-full h-full" />
                        ) : s.kind === "video" ? (
                          <video src={s.url} className="w-full h-full" controls />
                        ) : (
                          <div className="px-2 text-sm">{s.file.type || 'File'}</div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="font-medium">{s.file.name}</div>
                        <div className="text-sm text-gray-500">{Math.round(s.file.size / 1024)} KB</div>
                        <div className="mt-2">
                          <button
                            onClick={() => removeFile(i)}
                            className="mr-2 px-3 py-1 bg-red-500 text-white rounded text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="pt-2">
                  <button
                    onClick={uploadPlaceholder}
                    disabled={uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </section>
            )}
          </div>
          {uploadProgress !== null && (
            <div className="mt-3 w-full max-w-2xl">
              <div className="h-2 bg-gray-200 rounded overflow-hidden">
                <div
                  className="h-2 bg-blue-600"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="text-sm text-gray-600 mt-1">Uploading: {uploadProgress}%</div>
            </div>
          )}
          {uploadResult && (
            <div className="mt-4 w-full max-w-2xl bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="font-semibold text-lg mb-4">Upload Results</h3>
              
              {uploadResult.success && uploadResult.files && uploadResult.files.map((file: any, idx: number) => (
                <div key={idx} className="space-y-3 mb-4 pb-4 border-b border-gray-200 last:border-b-0">
                  {/* File Info */}
                  <div>
                    <p className="font-medium text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-600">{Math.round(file.size / 1024)} KB • {file.type}</p>
                  </div>

                  {/* AI Analysis Results */}
                  {file.analysis && (
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">AI Analysis</h4>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Sport Detected:</span>
                          <span className="ml-2 text-gray-900">{file.analysis.sport}</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                            file.analysis.confidence === 'high' ? 'bg-green-100 text-green-800' :
                            file.analysis.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {file.analysis.confidence} confidence
                          </span>
                        </div>
                        
                        {file.analysis.description && (
                          <div>
                            <span className="font-medium text-gray-700">Description:</span>
                            <p className="mt-1 text-gray-700 italic">{file.analysis.description}</p>
                          </div>
                        )}

                        {file.analysis.details && (
                          <div>
                            <span className="font-medium text-gray-700">Details:</span>
                            <p className="mt-1 text-gray-700">{file.analysis.details}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!file.analysis && file.type.startsWith('image/') && (
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-sm text-yellow-800">
                      ⚠️ AI analysis not available. Please check Gemini API configuration.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}