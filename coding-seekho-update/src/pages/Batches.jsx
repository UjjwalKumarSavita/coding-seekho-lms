import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Empty } from '../components/AppLayout';

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([api('/batches'), api('/public/courses')])
      .then(([batchData, courseData]) => { setBatches(batchData); setCatalog(courseData); })
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="skeleton-page">Loading batches...</div>;
  const active = batches.filter(batch => batch.enrollmentStatus === 'ACTIVE');
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">LEARNING SPACES</p><h1>My batches</h1><p>Each approved batch has its own classes, assignments and group conversation.</p></div></div>
      {active.length === 0 ? <section className="panel"><Empty text="Your account is ready. LLC administration will add you to a batch after enrollment approval." /></section> :
        <div className="batch-grid">{active.map((batch, index) => <Link className="batch-card" to={`/batches/${batch.id}`} key={batch.id}>
          <div className={`batch-art art-${index % 3}`}><span>{batch.code.slice(-2)}</span></div>
          <div><small>{batch.code}</small><h2>{batch.name}</h2><p>{batch.description}</p>
            <div className="batch-meta"><span>{batch.feePaid ? 'Fee verified' : 'Fee review pending'}</span><b>Open workspace →</b></div>
          </div>
        </Link>)}</div>}
      <section className="panel catalog-panel">
        <div className="section-heading"><div><p className="eyebrow">LLC CATALOG</p><h2>Learning at LLC World</h2></div></div>
        <div className="course-strip">{catalog.map(course => <article key={course.id}><small>{course.code}</small><strong>{course.name}</strong><p>{course.description}</p></article>)}</div>
      </section>
    </>
  );
}
