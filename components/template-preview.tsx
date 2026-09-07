import { Image as ImageIcon, ArrowRight } from 'lucide-react';
export function TemplatePreview({ id }: { id: string }) {
  return (
    <div
      className={'layout-preview layout-' + id}
      aria-label={'Skema layout ' + id}
    >
      <div className="layout-photo">
        <span className="layout-brand">YOUR BRAND</span>
        <div className="layout-photo-label">
          <ImageIcon />
          <span>VISUAL AI / FOTO</span>
        </div>
      </div>
      <div className="layout-copy">
        {id === 'serif' && <span className="layout-tag">KATEGORI</span>}
        {id === 'highlight' && <span className="layout-tag">NEWS UPDATE</span>}
        <h3>
          {id === 'highlight' ? (
            <>
              Cerita dengan <mark>poin penting</mark> yang menonjol.
            </>
          ) : id === 'statement' ? (
            <>
              HEADLINE
              <br />
              BESAR.
              <br />
              PESAN KUAT.
            </>
          ) : id === 'sport' ? (
            <>
              MOMEN HEBAT.
              <br />
              CERITA BARU.
            </>
          ) : id === 'yellow' ? (
            <>
              HEADLINE UTAMA
              <br />
              <em>
                Informasi penting,
                <br />
                langsung ke intinya.
              </em>
            </>
          ) : id === 'serif' ? (
            <>
              Sebuah cerita
              <br />
              yang layak
              <br />
              dibagikan.
            </>
          ) : id === 'story' ? (
            <>
              Headline utama
              <br />
              dan cerita
              <br />
              di baliknya.
            </>
          ) : (
            <>
              HEADLINE UTAMA
              <br />
              <em>
                CERITAKAN MOMEN
                <br />
                DALAM BEBERAPA KATA.
              </em>
            </>
          )}
        </h3>
        {['serif', 'story', 'sport'].includes(id) &&
          (id === 'serif' ? (
            <ArrowRight className="layout-arrow" />
          ) : (
            <div className="layout-body">
              {id === 'sport'
                ? 'SWIPE FOR MORE'
                : 'Teks ringkasan dengan ruang untuk konteks dan informasi pendukung.'}
            </div>
          ))}
      </div>
    </div>
  );
}
