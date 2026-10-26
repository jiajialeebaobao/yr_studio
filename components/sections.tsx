import EnvironmentCarousel from "./environment-carousel";
import BookingForm from "./booking-form";

export function Header() { return (<header className="site-header">
      <nav className="nav" aria-label="主导航">
        <a className="brand" href="#top" aria-label="怡然集瑜伽工作室首页">
          <span className="brand-mark">怡</span>
          <span>怡然集瑜伽工作室</span>
        </a>
        <div className="nav-links">
          <a href="#classes">课程</a>
          <a href="#studio">空间</a>
          <a href="#schedule">课表</a>
          <a href="#pricing">价格</a>
        </div>
        <a className="nav-cta" href="#booking">预约体验</a>
      </nav>
    </header>); }

export function Hero() { return (<section className="hero" aria-label="怡然集瑜伽工作室">
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">Breath · Balance · Flow</span>
            <h1>怡然集瑜伽<br />工作室</h1>
            <p className="hero-text">
              位于城市写字楼中的瑜伽空间，以哈他、流瑜伽、修复和呼吸练习，陪你把身体重新带回稳定、清醒与松弛。
            </p>
            <div className="hero-actions">
              <a className="button" href="#booking">预约第一节课</a>
              <a className="button secondary" href="#classes">查看课程</a>
            </div>
            <div className="hero-metrics" aria-label="工作室数据">
              <div className="metric">
                <strong>8</strong>
                <span>人以内小班</span>
              </div>
              <div className="metric">
                <strong>12+</strong>
                <span>每周主题课程</span>
              </div>
              <div className="metric">
                <strong>90</strong>
                <span>分钟深度练习</span>
              </div>
            </div>
          </div>
        </div>
      </section>); }

export function Courses() { return (<section id="classes">
        <div className="section-inner">
          <div className="section-head">
            <div>
              <span className="eyebrow">Classes</span>
              <h2>从温和觉察到稳定进阶</h2>
            </div>
            <p className="section-lede">
              每节课都保留足够的调整时间，老师会根据学员状态给出替代动作，让初学者和长期练习者都能找到适合自己的节奏。
            </p>
          </div>

          <div className="classes-grid">
            <article className="class-card">
              <div>
                <div className="class-top">
                  <span className="tag">初学友好</span>
                  <span>01</span>
                </div>
                <h3>基础哈他</h3>
                <p>拆解站姿、前屈、扭转和后弯，用清晰的发力路径建立身体稳定性。</p>
              </div>
              <div className="class-meta">
                <span>60 分钟</span>
                <span>周一 / 周四</span>
              </div>
            </article>

            <article className="class-card">
              <div>
                <div className="class-top">
                  <span className="tag">能量流动</span>
                  <span>02</span>
                </div>
                <h3>晨间流瑜伽</h3>
                <p>以呼吸串联动作，唤醒核心和肩髋，让一天从有力量的专注开始。</p>
              </div>
              <div className="class-meta">
                <span>75 分钟</span>
                <span>周二 / 周六</span>
              </div>
            </article>

            <article className="class-card">
              <div>
                <div className="class-top">
                  <span className="tag">深度放松</span>
                  <span>03</span>
                </div>
                <h3>修复与呼吸</h3>
                <p>借助辅具停留和呼吸练习，缓解紧张、改善睡眠，适合下班后的恢复。</p>
              </div>
              <div className="class-meta">
                <span>90 分钟</span>
                <span>周三 / 周日</span>
              </div>
            </article>
          </div>
        </div>
      </section>); }

export function Studio() { return (<section id="studio" className="studio-band">
        <div className="section-inner studio-layout">
          <div className="studio-photo">
            <img src="/assets/hero-yoga-studio.png" alt="明亮安静的瑜伽工作室空间" />
          </div>
          <div>
            <span className="eyebrow">Studio</span>
            <h2>一间让呼吸慢下来的练习室</h2>
            <p className="section-lede">
              木地板、自然光、干净辅具和低噪音环境，让身体在进入体式之前，先感到被妥善安放。
            </p>
            <div className="feature-list">
              <div className="feature">
                <span className="feature-icon">✓</span>
                <div>
                  <strong>专业辅具</strong>
                  <span>瑜伽砖、伸展带、抱枕与毛毯均可免费使用。</span>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon">✓</span>
                <div>
                  <strong>小班照看</strong>
                  <span>老师会观察动作细节，提供安全、适度的调整。</span>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon">✓</span>
                <div>
                  <strong>茶歇区域</strong>
                  <span>课后可短暂停留，给练习一个柔和的收尾。</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <EnvironmentCarousel />
      </section>); }

export function Teachers() { return (<section id="teachers">
        <div className="section-inner">
          <div className="section-head">
            <div>
              <span className="eyebrow">Teachers</span>
              <h2>老师不是示范者，而是陪伴者</h2>
            </div>
            <p className="section-lede">
              我们重视动作背后的感受，也重视每个人身体经验的差异。练习不追求完成某个形状，而是学会更准确地照顾自己。
            </p>
          </div>

          <div className="teachers-grid">
            <article className="teacher-card">
              <div className="teacher-avatar">林</div>
              <h3>林予安</h3>
              <p>哈他与女性健康方向，擅长用细致口令建立稳定根基。</p>
            </article>
            <article className="teacher-card">
              <div className="teacher-avatar">周</div>
              <h3>周辰</h3>
              <p>流瑜伽与功能训练背景，课程节奏清晰，兼顾力量与呼吸。</p>
            </article>
            <article className="teacher-card">
              <div className="teacher-avatar">许</div>
              <h3>许南</h3>
              <p>修复瑜伽与冥想带领者，适合压力恢复与睡眠改善练习。</p>
            </article>
          </div>
        </div>
      </section>); }

export function Pricing() { return (<section id="pricing">
        <div className="section-inner">
          <div className="section-head">
            <div>
              <span className="eyebrow">Pricing</span>
              <h2>按你的节奏开始</h2>
            </div>
            <p className="section-lede">
              先用体验课确认空间、老师和练习方式是否适合你，再选择更长期的练习计划。
            </p>
          </div>

          <div className="pricing-grid">
            <article className="price-card">
              <div>
                <span className="tag">体验</span>
                <h3>单次体验课</h3>
                <div className="price">¥99</div>
                <p>适合第一次到店，含课前身体状态沟通。</p>
                <ul>
                  <li>任选一节常规课</li>
                  <li>免费使用辅具</li>
                  <li>课后练习建议</li>
                </ul>
              </div>
              <a className="button secondary" href="#booking">预约体验</a>
            </article>

            <article className="price-card featured">
              <div>
                <span className="tag">推荐</span>
                <h3>月度练习卡</h3>
                <div className="price">¥680 <small>/ 月</small></div>
                <p>适合每周 1-2 次稳定练习，帮助身体建立连续记忆。</p>
                <ul>
                  <li>8 次小班课程</li>
                  <li>可约所有常规课</li>
                  <li>赠 1 次呼吸练习</li>
                </ul>
              </div>
              <a className="button" href="#booking">选择月卡</a>
            </article>

            <article className="price-card">
              <div>
                <span className="tag">私教</span>
                <h3>一对一课程</h3>
                <div className="price">¥360 <small>/ 次</small></div>
                <p>针对体态、旧伤恢复、进阶体式或个性化练习目标。</p>
                <ul>
                  <li>课前评估</li>
                  <li>定制练习方案</li>
                  <li>动作细节记录</li>
                </ul>
              </div>
              <a className="button secondary" href="#booking">咨询私教</a>
            </article>
          </div>
        </div>
      </section>); }

export function BookingSection() { return (<section id="booking" className="booking">
        <div className="section-inner booking-layout">
          <div>
            <span className="eyebrow">Booking</span>
            <h2>给自己留一小时，重新听见身体</h2>
            <p className="section-lede">
              留下联系方式后，我们会与你确认可预约时段、开课人数和到店提示。
            </p>
            <div className="booking-rules" aria-label="预约规则">
              <strong>预约规则</strong>
              <span>课程需提前 4 小时预约。</span>
              <span>常规小班满 3 人预约才开课。</span>
              <span>开课前 3 小时及以上取消，不收取费用。</span>
            </div>
            <div className="contact-list" aria-label="联系方式">
              <span>地址：内蒙古呼和浩特市玉泉区闻都世界城 17F1405</span>
              <span>电话：021-8800-6188</span>
              <span>营业：周一至周日 08:00 - 20:00</span>
            </div>
            <figure className="map-card" aria-label="怡然集瑜伽工作室位置示意图">
              <div className="map-image-wrap">
                <img className="map-ai-image" src="/assets/yoga-map-ai.jpg" alt="呼和浩特玉泉区闻都世界城周边的暖色轻运动风格地图" loading="lazy" />
                <span className="map-info-label road north-road">南二环路</span>
                <span className="map-info-label road vertical-road">锡林郭勒南路</span>
                <span className="map-info-label commercial world-city">闻都世界城</span>
                <span className="map-info-label commercial home-market">闻都家居建材城</span>
                <span className="map-info-label commercial curtain-market">宏绣墙布·窗帘</span>
                <span className="map-info-label park park-name">玉泉区五里营公园</span>
                <span className="map-info-label commercial wanjin">万锦融城</span>
                <div className="map-marker" aria-label="怡然集瑜伽工作室，闻都世界城 17F1405">
                  <div className="map-label">
                    <strong>怡然集瑜伽工作室</strong>
                    <span>闻都世界城 17F1405</span>
                  </div>
                </div>
                <svg className="map-arrow" viewBox="0 0 120 70" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 12 C 38 10, 70 24, 102 58" fill="none" stroke="#27302b" strokeLinecap="round" strokeWidth="12"></path>
                  <path d="M102 58 L74 54 M102 58 L91 30" fill="none" stroke="#27302b" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12"></path>
                  <path d="M10 12 C 38 10, 70 24, 102 58" fill="none" stroke="#fffdf8" strokeLinecap="round" strokeWidth="5"></path>
                </svg>
                <span className="map-dot" aria-hidden="true"></span>
              </div>
              
              <figcaption className="map-caption">
                <strong>门店位置</strong>
                <span>内蒙古呼和浩特市玉泉区闻都世界城 17F1405</span>
              </figcaption>
            </figure>
          </div>

          <BookingForm />
        </div>
      </section>); }

export function Footer() { return (<footer className="site-footer">
      <div className="footer-inner">
        <span>© 2026 怡然集瑜伽工作室</span>
        <span>Breath with care. Move with clarity.</span>
      </div>
    </footer>); }
