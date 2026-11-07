import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Giữ cho một lỗi render không biến cả trang thành màn hình trắng.
 * Không thay thế xử lý lỗi nghiệp vụ — chỉ là lưới an toàn cuối cùng.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Lỗi render:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="crash">
          <div className="card crash-card">
            <div className="eyebrow">Lỗi giao diện</div>
            <h1>Trang không dựng được.</h1>
            <p>
              Đây là lỗi phía giao diện, không phải kết quả tính toán. Tải lại trang để thử lại;
              nếu vẫn lỗi, đường dẫn chia sẻ vẫn giữ nguyên ngày giờ đã nhập.
            </p>
            <pre>{this.state.error.message}</pre>
            <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
              Tải lại trang
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
