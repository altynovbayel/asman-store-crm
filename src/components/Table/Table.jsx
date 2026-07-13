import Loader from '../Loader/Loader';
import Empty from '../Empty/Empty';
import styles from './Table.module.scss';

const Table = ({
  columns = [],
  dataSource = [],
  loading = false,
  emptyText = 'Данные не найдены',
  className = '',
  rowKey = (record) => record.id || record.key,
  ...props
}) => {
  return (
    <div className={`${styles.tableContainer} ${className}`} {...props}>
      <div className={styles.tableScrollWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th
                  key={col.key || col.dataIndex || index}
                  style={col.width ? { width: col.width } : undefined}
                  className={col.align ? styles[col.align] : ''}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className={styles.loadingCell}>
                  <Loader text="Загрузка списка..." />
                </td>
              </tr>
            ) : dataSource.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.emptyCell}>
                  <Empty title={emptyText} description="" />
                </td>
              </tr>
            ) : (
              dataSource.map((record, rowIndex) => {
                const key = typeof rowKey === 'function' ? rowKey(record) : record[rowKey] || rowIndex;
                return (
                  <tr key={key}>
                    {columns.map((col, colIndex) => {
                      const value = record[col.dataIndex];
                      const rendered = col.render ? col.render(value, record, rowIndex) : value;
                      return (
                        <td
                          key={col.key || col.dataIndex || colIndex}
                          className={col.align ? styles[col.align] : ''}
                        >
                          {rendered}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
