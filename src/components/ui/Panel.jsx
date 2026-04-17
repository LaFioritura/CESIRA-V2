export default function Panel({ title, right, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-header">
        <h3>{title}</h3>
        {right}
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}
