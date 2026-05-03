import React, { useState, useRef, useEffect } from 'react';

export default function RestaurantOrder() {
  const [currentStep, setCurrentStep] = useState('choice');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [address, setAddress] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [latitude, setLatitude] = useState(30.0444);
  const [longitude, setLongitude] = useState(31.2357);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);

  // تحميل Google Maps
  useEffect(() => {
    if (currentStep === 'location' && mapRef.current && !mapInstance.current) {
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDHvFpOj-4nH-Izg-xA1-Q2vjdMzh62XqA';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 15,
          center: { lat: latitude, lng: longitude },
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: false,
          zoomControl: true,
        });

        markerInstance.current = new window.google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map: map,
          title: 'موقعك',
          icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          draggable: true,
        });

        new window.google.maps.Marker({
          position: { lat: 30.0444, lng: 31.2357 },
          map: map,
          title: 'حلب الشهباء',
          icon: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
        });

        const line = new window.google.maps.Polyline({
          path: [
            { lat: latitude, lng: longitude },
            { lat: 30.0444, lng: 31.2357 }
          ],
          geodesic: true,
          strokeColor: '#d4af37',
          strokeOpacity: 0.7,
          strokeWeight: 3,
          map: map,
        });

        // عند سحب المؤشر
        markerInstance.current.addListener('drag', (e) => {
          const newLat = e.latLng.lat();
          const newLng = e.latLng.lng();
          
          setLatitude(newLat);
          setLongitude(newLng);
          
          line.setPath([
            { lat: newLat, lng: newLng },
            { lat: 30.0444, lng: 31.2357 }
          ]);
        });

        // الضغط على الخريطة
        map.addListener('click', (e) => {
          const newLat = e.latLng.lat();
          const newLng = e.latLng.lng();
          
          setLatitude(newLat);
          setLongitude(newLng);
          markerInstance.current.setPosition({ lat: newLat, lng: newLng });
          
          line.setPath([
            { lat: newLat, lng: newLng },
            { lat: 30.0444, lng: 31.2357 }
          ]);

          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
              const areaName = results[0].address_components
                .find(comp => comp.types.includes('administrative_area_level_2'))?.long_name || 
                results[0].address_components
                .find(comp => comp.types.includes('locality'))?.long_name || 
                'موقعك الحالي';
              setAddress(areaName);
            }
          });
        });

        mapInstance.current = map;
      };

      document.head.appendChild(script);
    }
  }, [currentStep, latitude, longitude]);

  // دالة توليد كود عشوائي
  const generateVerificationCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // دالة إرسال SMS (محاكاة)
  const sendSMS = async (phoneNumber, code) => {
    setLoading(true);
    
    try {
      // محاكاة تأخير الإرسال
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log(`SMS sent to ${phoneNumber}: Your verification code is ${code}`);
      
      setLoading(false);
      alert(`✅ تم إرسال الكود على الرقم: ${phoneNumber}\n\nالكود: ${code}`);
      return true;
    } catch (error) {
      setLoading(false);
      alert('❌ خطأ في إرسال الكود');
      return false;
    }
  };

  const handleChoice = (type) => {
    if (type === 'pickup') {
      setCurrentStep('branch');
    } else {
      setCurrentStep('delivery-phone');
    }
  };

  const handlePhoneSubmit = async () => {
    if (phone.length >= 10) {
      const code = generateVerificationCode();
      setGeneratedCode(code);
      
      const sent = await sendSMS(phone, code);
      if (sent) {
        setShowCodeInput(true);
      }
    } else {
      alert('أدخل رقم صحيح');
    }
  };

  const handleCodeVerify = () => {
    if (verificationCode === generatedCode) {
      setCodeVerified(true);
      setTimeout(() => setCurrentStep('location'), 500);
    } else {
      alert(`❌ الكود غير صحيح!\nالكود الصحيح: ${generatedCode}`);
    }
  };

  const handleLocationSubmit = () => {
    if (address.trim() && addressDetails.trim()) {
      alert('✅ تم استقبال طلبك! هنجيب لك الأكل في أقرب وقت');
      setCurrentStep('choice');
      setPhone('');
      setVerificationCode('');
      setAddress('');
      setAddressDetails('');
      setShowCodeInput(false);
      setCodeVerified(false);
      setGeneratedCode('');
    }
  };

  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLat = position.coords.latitude;
          const newLng = position.coords.longitude;
          
          setLatitude(newLat);
          setLongitude(newLng);

          if (mapInstance.current && markerInstance.current) {
            mapInstance.current.panTo({ lat: newLat, lng: newLng });
            markerInstance.current.setPosition({ lat: newLat, lng: newLng });
          }

          alert('✅ تم تحديد موقعك الحالي');
        },
        (error) => {
          const randomLat = 30.0444 + (Math.random() - 0.5) * 0.05;
          const randomLng = 31.2357 + (Math.random() - 0.05) * 0.05;
          setLatitude(randomLat);
          setLongitude(randomLng);
          alert('✅ تم تحديد موقع تقريبي');
        }
      );
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff' }}>
      <div style={{ position: 'fixed', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(circle at 1px 1px, #d4af37 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>

      <div style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ borderBottom: '1px solid #d4af37' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#d4af37', margin: 0 }}>
              حلب الشهباء
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#999', marginTop: '0.5rem' }}>الطعم الشامي الأصيل</p>
          </div>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem' }}>
          
          {currentStep === 'choice' && (
            <div>
              <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center', color: '#d4af37' }}>
                اختر طريقة الطلب
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <button
                  onClick={() => handleChoice('pickup')}
                  style={{ padding: '2rem', border: '2px solid #d4af37', backgroundColor: 'rgba(212, 175, 55, 0.05)', cursor: 'pointer', borderRadius: '0.5rem', transition: 'all 0.3s' }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d4af37', marginBottom: '0.5rem' }}>استلام</h3>
                  <p style={{ color: '#aaa', fontSize: '0.875rem' }}>شيل طلبك من عندنا مباشرة</p>
                </button>

                <button
                  onClick={() => handleChoice('delivery')}
                  style={{ padding: '2rem', border: '2px solid #d4af37', backgroundColor: 'rgba(212, 175, 55, 0.05)', cursor: 'pointer', borderRadius: '0.5rem', transition: 'all 0.3s' }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d4af37', marginBottom: '0.5rem' }}>توصيل</h3>
                  <p style={{ color: '#aaa', fontSize: '0.875rem' }}>هنوديك الطلب في بيتك بسرعة</p>
                </button>
              </div>
            </div>
          )}

          {currentStep === 'branch' && (
            <div>
              <button onClick={() => setCurrentStep('choice')} style={{ marginBottom: '1.5rem', background: 'none', border: 'none', color: '#d4af37', cursor: 'pointer', fontSize: '0.875rem' }}>
                ← العودة
              </button>
              <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '2rem', color: '#d4af37' }}>اختر الفرع</h2>
              <div style={{ padding: '1.5rem', border: '2px solid #d4af37', backgroundColor: 'rgba(212, 175, 55, 0.1)', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#d4af37' }}>فرع القاهرة - وسط البلد</h3>
                <p style={{ color: '#aaa', fontSize: '0.875rem', marginTop: '0.5rem' }}>العنوان: شارع محمد فريد - وسط البلد - القاهرة</p>
                <p style={{ color: '#aaa', fontSize: '0.875rem' }}>المواعيل: ١٠ الصبح - ١٢ بالليل</p>
                <button
                  onClick={() => alert('✅ تم اختيار الفرع!')}
                  style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', backgroundColor: '#d4af37', color: '#0a0a0a', fontWeight: 'bold', border: 'none', cursor: 'pointer', borderRadius: '0.25rem' }}
                >
                  شيل من هنا
                </button>
              </div>
            </div>
          )}

          {currentStep === 'delivery-phone' && !showCodeInput && (
            <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
              <div style={{ backgroundColor: '#fff', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem', padding: '2rem', width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
                <button onClick={() => setCurrentStep('choice')} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', fontSize: '1.5rem', color: '#999', cursor: 'pointer' }}>✕</button>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center', color: '#0a0a0a' }}>التحقق من رقم الهاتف</h2>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: '#f3f3f3', borderRadius: '1rem', border: '2px solid #e0e0e0', marginBottom: '1.5rem' }}>
                    <span style={{ color: '#0a0a0a', fontWeight: 'bold' }}>+2</span>
                    <input
                      type="tel"
                      placeholder="01xxxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', fontSize: '1.125rem', color: '#0a0a0a' }}
                    />
                  </div>
                  <button
                    onClick={handlePhoneSubmit}
                    disabled={phone.length < 10 || loading}
                    style={{ width: '100%', padding: '1rem', fontWeight: 'bold', borderRadius: '1rem', border: 'none', color: '#fff', cursor: (phone.length >= 10 && !loading) ? 'pointer' : 'not-allowed', backgroundColor: (phone.length >= 10 && !loading) ? '#888888' : '#cccccc' }}
                  >
                    {loading ? '⏳ جاري الإرسال...' : 'التالي'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'delivery-phone' && showCodeInput && !codeVerified && (
            <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
              <div style={{ backgroundColor: '#fff', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem', padding: '2rem', width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
                <button onClick={() => { setCurrentStep('choice'); setShowCodeInput(false); }} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', fontSize: '1.5rem', color: '#999', cursor: 'pointer' }}>✕</button>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center', color: '#0a0a0a' }}>التحقق من رقم الهاتف</h2>
                <p style={{ color: '#666', marginBottom: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
                  تم إرسال كود التحقق على: <strong>{phone}</strong>
                  <br/>
                  <span style={{ fontSize: '0.75rem', color: '#999' }}>ادخل الكود المكون من 4 أرقام</span>
                </p>
                <div>
                  <input
                    type="text"
                    placeholder="0000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.slice(0, 4))}
                    maxLength="4"
                    style={{ width: '100%', padding: '1rem', backgroundColor: '#f3f3f3', border: '2px solid #e0e0e0', textAlign: 'center', fontSize: '2rem', letterSpacing: '0.5em', borderRadius: '1rem', marginBottom: '1rem', color: '#0a0a0a' }}
                  />
                  <button
                    onClick={handleCodeVerify}
                    disabled={verificationCode.length < 4}
                    style={{ width: '100%', padding: '1rem', fontWeight: 'bold', borderRadius: '1rem', border: 'none', color: '#fff', cursor: verificationCode.length >= 4 ? 'pointer' : 'not-allowed', backgroundColor: verificationCode.length >= 4 ? '#888888' : '#cccccc' }}
                  >
                    التالي
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'location' && (
            <div>
              <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '2rem', color: '#d4af37' }}>تحديد الموقع والعنوان</h2>
              <div>
                <div style={{ position: 'relative', border: '2px solid #d4af37', borderRadius: '0.5rem', overflow: 'hidden', height: '400px', marginBottom: '1.5rem' }}>
                  <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
                  
                  <button
                    onClick={requestUserLocation}
                    style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', backgroundColor: '#fff', padding: '0.75rem', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
                    title="تحديد موقعي الحالي"
                  >
                    📍
                  </button>

                  <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', backgroundColor: '#fff', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                    <p style={{ margin: 0 }}>🔴 موقعك | 🟡 مطعمنا</p>
                  </div>
                </div>

                <div style={{ padding: '1rem', border: '2px solid #d4af37', borderRadius: '0.5rem', backgroundColor: 'rgba(212, 175, 55, 0.05)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                  <p style={{ color: '#d4af37', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>الموقع الحالي:</p>
                  <p style={{ color: '#aaa', margin: '0' }}>{latitude.toFixed(4)}° , {longitude.toFixed(4)}°</p>
                  <p style={{ color: '#666', fontSize: '0.75rem', margin: '0.5rem 0 0 0' }}>💡 اضغط على الخريطة أو اسحب المؤشر الأحمر</p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: '#d4af37', display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>الحي أو المنطقة</label>
                  <input
                    type="text"
                    placeholder="حي النخيل"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: 'transparent', border: '2px solid #d4af37', outline: 'none', borderRadius: '0.25rem', color: '#d4af37' }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: '#d4af37', display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>تفاصيل العنوان</label>
                  <textarea
                    placeholder="الشارع، الحارة، رقم البيت..."
                    value={addressDetails}
                    onChange={(e) => setAddressDetails(e.target.value)}
                    rows="4"
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: 'transparent', border: '2px solid #d4af37', outline: 'none', borderRadius: '0.25rem', color: '#d4af37', fontFamily: 'inherit', resize: 'none' }}
                  />
                </div>

                <button
                  onClick={handleLocationSubmit}
                  disabled={!address.trim() || !addressDetails.trim()}
                  style={{ width: '100%', padding: '0.75rem', fontWeight: 'bold', backgroundColor: '#d4af37', color: '#0a0a0a', border: 'none', cursor: !address.trim() || !addressDetails.trim() ? 'not-allowed' : 'pointer', opacity: !address.trim() || !addressDetails.trim() ? 0.5 : 1, borderRadius: '0.25rem' }}
                >
                  تمام، أوديني الطلب →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
      `}</style>
    </div>
  );
}