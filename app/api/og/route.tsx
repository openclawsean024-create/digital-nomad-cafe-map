import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || '全球數位牧民咖啡廳地圖';
  const desc = searchParams.get('desc') || '找到適合遠距工作的完美咖啡廳 ☕🌍';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#00704A',
          backgroundImage: 'radial-gradient(circle at 20% 80%, #004d33 0%, #00704A 50%)',
          fontSize: 48,
          fontWeight: 700,
          padding: '60px',
        }}
      >
        {/* Top row: emoji */}
        <div style={{ display: 'flex', fontSize: 120, marginBottom: 40 }}>☕🌍</div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            color: 'white',
            fontSize: 64,
            fontWeight: 800,
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: 24,
          }}
        >
          {title}
        </div>

        {/* Description */}
        <div
          style={{
            display: 'flex',
            color: 'rgba(255,255,255,0.85)',
            fontSize: 28,
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          {desc}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 8,
            backgroundColor: '#00A86B',
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
