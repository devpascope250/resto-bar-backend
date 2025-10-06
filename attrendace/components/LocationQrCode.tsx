// app/components/LocationQrCodeClient.tsx
"use client";

import QRCode from "react-qr-code";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function LocationQrCodeClient({ data }: { data: any }) {
  console.log(data);
  
  return (
    <div className="flex flex-col items-center justify-center w-50 h-50 m-auto">
      <QRCode
        value={JSON.stringify(data)}
        size={600}
        className="h-50 w-50 border-3 border-black rounded-lg"
      />
    </div>
  );
}
