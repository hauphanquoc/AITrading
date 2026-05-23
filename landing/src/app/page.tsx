import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <span className="text-gray-900 font-bold text-sm">AI</span>
              </div>
              <span className="text-xl font-bold text-white">Trading Assistant</span>
            </div>
            <Link
              href="/login"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold rounded-lg transition-colors"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-amber-400 text-sm font-medium">Powered by AI Gemini</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Phân tích giao dịch{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
              XAUUSD
            </span>
            <br />
            bằng trí tuệ nhân tạo
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Nhận tín hiệu Entry, Stop Loss, Take Profit chính xác từ AI.
            Hỗ trợ phân tích đa khung thời gian với dữ liệu real-time từ MT5.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold rounded-xl text-lg transition-colors"
            >
              Bắt đầu phân tích
            </Link>
            <a
              href="#features"
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl text-lg transition-colors border border-gray-700"
            >
              Tìm hiểu thêm
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-amber-400 mb-2">8+</div>
            <div className="text-gray-400">Khung thời gian</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-amber-400 mb-2">24/7</div>
            <div className="text-gray-400">Hoạt động liên tục</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-amber-400 mb-2">AI</div>
            <div className="text-gray-400">Gemini Pro</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-amber-400 mb-2">MT5</div>
            <div className="text-gray-400">Real-time data</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Tính năng nổi bật
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Công cụ hỗ trợ phân tích giao dịch vàng hiện đại và thông minh
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800 hover:border-amber-500/50 transition-colors">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Phân tích AI thông minh</h3>
              <p className="text-gray-400">
                Sử dụng AI Gemini để phân tích biểu đồ OHLC và đưa ra nhận định thị trường chính xác.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800 hover:border-amber-500/50 transition-colors">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Tín hiệu Entry/SL/TP</h3>
              <p className="text-gray-400">
                Nhận tín hiệu giao dịch cụ thể với điểm Entry, Stop Loss và Take Profit rõ ràng.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800 hover:border-amber-500/50 transition-colors">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Biểu đồ real-time</h3>
              <p className="text-gray-400">
                Biểu đồ nến Nhật Bản với dữ liệu real-time từ MT5, hỗ trợ 8 khung thời gian.
              </p>
            </div>
            {/* Feature 4 */}
            <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800 hover:border-amber-500/50 transition-colors">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Hệ thống Point</h3>
              <p className="text-gray-400">
                Quản lý credit dễ dàng. Mỗi phân tích có tín hiệu sẽ trừ 1 point từ tài khoản.
              </p>
            </div>
            {/* Feature 5 */}
            <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800 hover:border-amber-500/50 transition-colors">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Lịch sử phân tích</h3>
              <p className="text-gray-400">
                Xem lại tất cả các phân tích trước đó. Theo dõi và học hỏi từ các tín hiệu AI.
              </p>
            </div>
            {/* Feature 6 */}
            <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800 hover:border-amber-500/50 transition-colors">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Phân tích tiếng Việt</h3>
              <p className="text-gray-400">
                Nhận phân tích chi tiết bằng tiếng Việt, dễ hiểu và phù hợp với trader Việt Nam.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Cách sử dụng
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Chỉ với 4 bước đơn giản để nhận tín hiệu giao dịch từ AI
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-gray-900">1</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Đăng nhập</h3>
              <p className="text-gray-400">
                Sử dụng tài khoản được cấp để đăng nhập vào hệ thống
              </p>
            </div>
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-gray-900">2</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Chọn timeframe</h3>
              <p className="text-gray-400">
                Chọn khung thời gian phù hợp với chiến lược giao dịch của bạn
              </p>
            </div>
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-gray-900">3</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Phân tích</h3>
              <p className="text-gray-400">
                Nhấn nút &quot;Phân tích&quot; để AI xử lý dữ liệu biểu đồ
              </p>
            </div>
            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-gray-900">4</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Nhận tín hiệu</h3>
              <p className="text-gray-400">
                Xem kết quả phân tích và tín hiệu Entry, SL, TP từ AI
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Đăng nhập ngay để trải nghiệm phân tích XAUUSD bằng AI
          </p>
          <Link
            href="/login"
            className="inline-flex px-10 py-4 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold rounded-xl text-lg transition-colors"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded flex items-center justify-center">
              <span className="text-gray-900 font-bold text-xs">AI</span>
            </div>
            <span className="text-gray-400">AI Trading Assistant</span>
          </div>
          <p className="text-gray-500 text-sm">
            &copy; 2026 AI Trading Assistant. Chỉ mang tính chất hỗ trợ, không phải khuyến nghị đầu tư.
          </p>
        </div>
      </footer>
    </div>
  );
}
