(function(){
"use strict";

var rupiah = function(n){ return 'Rp' + Math.round(n).toLocaleString('id-ID'); };
var $ = function(s,r){ return (r||document).querySelector(s); };
var $all = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
var store = {
  get: function(k,d){ try{ var v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch(e){ return d; } },
  set: function(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};

/* ---------------- theme toggle ---------------- */
(function(){
  var btn = $('#themeBtn');
  var saved = store.get('erp-theme', null);
  if(saved) document.documentElement.setAttribute('data-theme', saved);
  if(btn){
    btn.addEventListener('click', function(){
      var cur = document.documentElement.getAttribute('data-theme');
      var mql = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var next = cur === 'dark' ? 'light' : (cur === 'light' ? 'dark' : (mql ? 'light' : 'dark'));
      document.documentElement.setAttribute('data-theme', next);
      store.set('erp-theme', next);
    });
  }
})();

/* ---------------- nav / routing ---------------- */
var panels = $all('.panel');
var navlist = $('#navlist'), railtabs = $('#railtabs');
if(navlist && railtabs){
  panels.forEach(function(p, i){
    var num = i+1;
    var b = document.createElement('button');
    b.className = 'navbtn' + (i===0?' active':'');
    b.innerHTML = '<span class="num">'+num+'</span><span class="label"><b>'+p.dataset.title+'</b><small>'+p.dataset.sub+'</small></span>';
    b.addEventListener('click', function(){ show(p.id); });
    navlist.appendChild(b);

    var t = document.createElement('button');
    t.textContent = 'P'+num;
    t.className = i===0?'active':'';
    t.addEventListener('click', function(){ show(p.id); });
    railtabs.appendChild(t);
  });
}

function show(id){
  panels.forEach(function(p){ p.classList.toggle('active', p.id===id); });
  $all('.navbtn').forEach(function(b,i){ b.classList.toggle('active', panels[i].id===id); });
  $all('#railtabs button').forEach(function(b,i){ b.classList.toggle('active', panels[i].id===id); });
  window.scrollTo(0,0);
}
show('p1');

/* ---------------- SQL Query Inspector Logger ---------------- */
var sqlDrawerContent = $('#sqlDrawerContent');
var sqlDrawer = $('#sqlDrawer');

function escapeHtml(s){
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function logSql(badge, query, desc){
  if(!sqlDrawerContent) return;
  var firstComment = sqlDrawerContent.querySelector('.comment');
  if(firstComment && sqlDrawerContent.children.length === 1){
    sqlDrawerContent.innerHTML = '';
  }
  var now = new Date();
  var timeStr = now.toTimeString().split(' ')[0] + '.' + ('00'+now.getMilliseconds()).slice(-3);
  var entry = document.createElement('div');
  entry.className = 'sql-entry';
  entry.innerHTML = '<span class="sql-badge">'+escapeHtml(badge)+'</span><span class="sql-time">'+timeStr+'</span><span class="sql-query">'+escapeHtml(query)+'</span>' + (desc ? '<span class="sql-desc">&rarr; '+escapeHtml(desc)+'</span>' : '');
  sqlDrawerContent.appendChild(entry);
  sqlDrawerContent.scrollTop = sqlDrawerContent.scrollHeight;
  while(sqlDrawerContent.children.length > 60){
    sqlDrawerContent.removeChild(sqlDrawerContent.firstChild);
  }
}

var sqlToggleBtn = $('#sqlToggleBtn');
var closeSqlBtn = $('#closeSqlBtn');
var clearSqlBtn = $('#clearSqlBtn');

if(sqlToggleBtn && sqlDrawer){
  sqlToggleBtn.addEventListener('click', function(){
    sqlDrawer.classList.toggle('open');
  });
}
if(closeSqlBtn && sqlDrawer){
  closeSqlBtn.addEventListener('click', function(){
    sqlDrawer.classList.remove('open');
  });
}
if(clearSqlBtn && sqlDrawerContent){
  clearSqlBtn.addEventListener('click', function(){
    sqlDrawerContent.innerHTML = '<div class="sql-entry comment">-- Log dibersihkan. Menunggu transaksi berikutnya...</div>';
  });
}

/* ---------------- Keyboard Shortcuts (1 - 5) ---------------- */
window.addEventListener('keydown', function(e){
  var tag = (document.activeElement && document.activeElement.tagName) || '';
  if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

  if(['1','2','3','4','5'].indexOf(e.key) !== -1){
    e.preventDefault();
    show('p' + e.key);
  }
});

/* =========================================================
   PRAKTIKUM 1
   ========================================================= */
(function(){
  var masterRows = [
    ['Penjualan','Spreadsheet','Data pesanan terlambat diperbarui'],
    ['Gudang','Aplikasi stok','Stok berbeda dengan catatan pembelian'],
    ['Produksi','Formulir manual','Jadwal produksi sering berubah'],
    ['Keuangan','Aplikasi akuntansi','Transaksi harus dimasukkan ulang']
  ];
  var tbody = $('#p1-master tbody');
  if(tbody){
    masterRows.forEach(function(r){
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td>';
      tbody.appendChild(tr);
    });
  }

  var state = store.get('p1-state', { stock: 120, raw: 500, price: 150000, rawPerUnit: 3 });
  function renderStock(){
    if($('#p1-stockview')) $('#p1-stockview').textContent = state.stock;
    if($('#p1-rawview')) $('#p1-rawview').textContent = state.raw;
  }
  renderStock();

  var condText = {
    normal: null,
    stok: {cls:'warn', title:'Dampak: Stok bahan baku tidak mencukupi', body:'Bagian proses yang terdampak: <b>Produksi</b> dan <b>Pembelian</b>. Sistem harus otomatis memicu permintaan pembelian bahan baku tambahan sebelum pesanan dapat diproduksi penuh, dan memberi tahu Penjualan agar tanggal kirim disesuaikan &mdash; bukan dijanjikan sepihak seperti pada proses lama.'},
    ubah: {cls:'warn', title:'Dampak: Pelanggan mengubah jumlah pesanan', body:'Bagian proses yang terdampak: <b>Penjualan</b>, <b>Produksi</b>, dan <b>Gudang</b>. Sistem harus menghitung ulang kebutuhan stok dan bahan baku secara otomatis begitu jumlah pesanan diubah, tanpa perlu dosen/staf mencatat ulang manual ke semua pihak terkait.'},
    bayar: {cls:'warn', title:'Dampak: Pembayaran pelanggan belum diterima', body:'Bagian proses yang terdampak: <b>Keuangan</b>. Sistem dapat dikonfigurasi agar pengiriman barang menunggu status pembayaran (atau berjalan dengan status piutang tercatat jelas), sehingga Keuangan punya visibilitas real-time atas piutang yang belum tertagih tanpa menelepon/mencari dokumen manual.'},
    telat: {cls:'warn', title:'Dampak: Produksi mengalami keterlambatan', body:'Bagian proses yang terdampak: <b>Produksi</b> dan <b>Penjualan</b>. Sistem harus memperbarui estimasi tanggal kirim secara otomatis begitu jadwal produksi bergeser, dan mengirim notifikasi ke Penjualan agar pelanggan diberi tahu lebih awal &mdash; mencegah janji kirim yang meleset seperti pada kasus awal.'}
  };

  if($('#p1-run')){
    $('#p1-run').addEventListener('click', function(){
      var qty = parseInt($('#p1-qty').value,10) || 0;
      var cust = $('#p1-cust').value || 'Pelanggan';
      var cond = $('#p1-cond').value;
      var box = $('#p1-result');
      if(qty <= 0){ box.className='resultbox show bad'; box.innerHTML='Jumlah pesanan harus lebih dari 0.'; return; }

      var rawNeeded = qty * state.rawPerUnit;
      var stockOk = qty <= state.stock;
      var rawOk = rawNeeded <= state.raw;
      var total = qty * state.price;

      var html = '<div class="kv"><span>Pesanan</span><b>'+qty+' unit &mdash; '+cust+'</b></div>';
      html += '<div class="kv"><span>Dampak ke Gudang (stok produk)</span><b>'+state.stock+' &rarr; '+Math.max(state.stock-qty,0)+' unit</b></div>';
      html += '<div class="kv"><span>Dampak ke Produksi (bahan baku terpakai)</span><b>'+rawNeeded+' unit dari '+state.raw+' tersedia</b></div>';
      html += '<div class="kv"><span>Dampak ke Keuangan (jurnal otomatis)</span><b>Dr Piutang Usaha / Cr Penjualan '+rupiah(total)+'</b></div>';

      var boxClass = 'ok';
      if(!stockOk || !rawOk){
        boxClass='bad';
        html += '<div class="kv"><span style="color:var(--bad)">Peringatan</span><b style="color:var(--bad)">'+(!stockOk?'Stok produk jadi tidak mencukupi. ':'')+(!rawOk?'Bahan baku tidak mencukupi untuk memenuhi pesanan ini.':'')+'</b></div>';
      }
      if(cond !== 'normal'){
        var c = condText[cond];
        html += '<hr style="border:none;border-top:1px solid var(--border);margin:10px 0">';
        html += '<b style="color:var(--'+(c.cls==='warn'?'warn':'bad')+')">'+c.title+'</b><p style="margin:6px 0 0;font-size:12.5px">'+c.body+'</p>';
        boxClass = 'warn';
      }
      box.className = 'resultbox show ' + boxClass;
      box.innerHTML = html;

      if(stockOk && rawOk){
        state.stock -= qty; state.raw -= rawNeeded;
        store.set('p1-state', state); renderStock();
        logSql('P1 / SALES', 'BEGIN; INSERT INTO sales_orders (cust, qty, total) VALUES (\'' + cust.replace(/'/g,"''") + '\', ' + qty + ', ' + total + '); UPDATE finished_goods SET stock = stock - ' + qty + '; UPDATE raw_materials SET stock = stock - ' + rawNeeded + '; INSERT INTO gl_journal (dr, cr, amt) VALUES (\'Piutang Usaha\', \'Penjualan\', ' + total + '); COMMIT;', 'Simulasi sukses: stok produk berkurang ' + qty + ', bahan baku berkurang ' + rawNeeded + ', jurnal piutang tercatat.');
      } else {
        logSql('P1 / INTEGRITY-CHECK', 'ROLLBACK; -- Inventory Check Failed (stockOk=' + stockOk + ', rawOk=' + rawOk + ')', 'Validasi ERP gagal: persediaan tidak mencukupi.');
      }
    });
  }

  if($('#p1-reset')){
    $('#p1-reset').addEventListener('click', function(){
      state = { stock: 120, raw: 500, price: 150000, rawPerUnit: 3 };
      store.set('p1-state', state); renderStock();
      $('#p1-result').className='resultbox';
      $('#p1-result').innerHTML='<span class="hint">Stok dikembalikan ke kondisi awal.</span>';
      logSql('P1 / RESET', 'UPDATE master_simulation_state SET stock = 120, raw = 500;', 'Reset stok dan bahan baku simulasi Praktikum 1 ke kondisi awal.');
    });
  }
})();

/* =========================================================
   PRAKTIKUM 2
   ========================================================= */
(function(){
  var mods = ['Penjualan','Gudang','Produksi','Pembelian','Keuangan'];
  var access = {
    'Modul Penjualan':      ['rw','r','r','n','r'],
    'Modul Gudang':         ['r','rw','r','r','r'],
    'Modul Produksi':       ['r','r','rw','r','n'],
    'Modul Pembelian':      ['n','r','r','rw','r'],
    'Modul Keuangan':       ['r','n','n','r','rw']
  };
  var tbody = $('#p2-matrix tbody');
  if(tbody){
    Object.keys(access).forEach(function(rowName){
      var tr = document.createElement('tr');
      var tds = '<td>'+rowName+'</td>';
      access[rowName].forEach(function(v){
        var color = v==='rw' ? 'var(--good)' : (v==='r' ? 'var(--warn)' : 'var(--border)');
        tds += '<td><span class="dotcell" style="background:'+color+'"></span></td>';
      });
      tr.innerHTML = tds;
      tbody.appendChild(tr);
    });
  }

  var backups = store.get('p2-backups', []);
  function renderBackups(){
    var list = $('#p2-backuplist');
    if(!list) return;
    if(backups.length===0){ list.innerHTML = '<span class="hint">Belum ada backup dijalankan.</span>'; return; }
    list.innerHTML = backups.map(function(b,i){
      return '<div class="logitem"><span>'+b.label+'</span><span><button class="btn ghost" style="padding:3px 9px;font-size:11.5px" data-i="'+i+'">Pulihkan</button></span></div>';
    }).join('');
    $all('#p2-backuplist button').forEach(function(btn){
      btn.addEventListener('click', function(){
        var i = parseInt(btn.dataset.i,10);
        alert_box('Memulihkan sistem ke snapshot: '+backups[i].label+'. Server aplikasi di-restart dari backup ini; data transaksi setelah waktu tersebut perlu diinput ulang dari dokumen sumber.');
      });
    });
  }
  function alert_box(msg){
    var box = $('#p2-result'); box.className='resultbox show ok'; box.innerHTML = msg;
  }
  renderBackups();

  if($('#p2-backup')){
    $('#p2-backup').addEventListener('click', function(){
      var now = new Date();
      var label = 'Snapshot '+now.toLocaleDateString('id-ID')+' '+now.toLocaleTimeString('id-ID');
      backups.push({ label: label });
      if(backups.length>8) backups.shift();
      store.set('p2-backups', backups); renderBackups();
      logSql('P2 / BACKUP', 'pg_dump --format=custom --file=/backups/erp_snapshot_' + Date.now() + '.pgdump erp_meta_db;', 'Pencadangan database (full schema & data) berhasil dieksekusi: ' + label);
    });
  }
  if($('#p2-clear')){
    $('#p2-clear').addEventListener('click', function(){
      backups=[]; store.set('p2-backups',backups); renderBackups();
      logSql('P2 / CLEANUP', 'VACUUM FULL; TRUNCATE TABLE system_backup_snapshots;', 'Daftar riwayat snapshot backup dibersihkan.');
    });
  }

  var disruptions = {
    db: {point:'Server Database', impact:'Seluruh data tidak dapat dibaca/ditulis; semua modul berhenti berfungsi meski server aplikasi sehat.', action:'Alihkan ke database cadangan (failover) jika tersedia; jika tidak, pulihkan dari backup terakhir dan validasi integritas data sebelum sistem dibuka kembali.'},
    app: {point:'Server Aplikasi', impact:'Pengguna tidak bisa login/mengakses ERP sama sekali walau database aktif &mdash; ini titik kegagalan tunggal pada rancangan dasar.', action:'Alihkan trafik ke server aplikasi cadangan via load balancer. Jangka panjang: tambah redundansi (minimal 2 instance aktif).'},
    net: {point:'Lapisan Jaringan', impact:'Pengguna jarak jauh kehilangan akses; pengguna di kantor (LAN internal) masih bisa bekerja jika ERP di-hosting lokal.', action:'Siapkan jalur internet cadangan (ISP kedua) untuk akses luar kantor; pengguna kantor tetap bekerja via LAN sambil jaringan utama dipulihkan.'},
    unauth: {point:'Kontrol Akses (Otorisasi)', impact:'Risiko kebocoran data keuangan sensitif atau manipulasi data oleh pihak tidak berwenang.', action:'Sistem menolak akses berdasarkan matriks hak akses (lihat tabel di atas); percobaan akses dicatat di log audit dan dilaporkan ke admin sistem secara otomatis.'},
    lost: {point:'Sistem Pencadangan', impact:'Data transaksi sejak backup terakhir hilang permanen &mdash; dampak lebih besar dari downtime karena data riwayat tidak bisa dibangun ulang begitu saja.', action:'Evaluasi dan uji ulang jadwal backup otomatis; aktifkan pencadangan ganda (on-site dan off-site) agar kegagalan satu titik tidak membuat data hilang total.'}
  };

  if($('#p2-simrun')){
    $('#p2-simrun').addEventListener('click', function(){
      var k = $('#p2-sim').value, d = disruptions[k];
      var box = $('#p2-result');
      box.className = 'resultbox show bad';
      box.innerHTML = '<div class="kv"><span>Titik kegagalan</span><b>'+d.point+'</b></div><p style="margin:8px 0 4px;font-size:12.5px"><b>Dampak:</b> '+d.impact+'</p><p style="margin:0;font-size:12.5px"><b>Tindakan:</b> '+d.action+'</p>';
      logSql('P2 / RESILIENCE', 'SELECT audit_architecture_failure(\'' + d.point.replace(/'/g,"''") + '\', \'ALERT_CRITICAL\');', 'Simulasi kegagalan infrastruktur: ' + d.point);
    });
  }

  if($('#p2-scale')){
    $('#p2-scale').addEventListener('click', function(){
      var users = parseInt($('#p2-users').value,10) || 0;
      var budget = parseInt($('#p2-budget').value,10) || 0;
      var ratio = users / 100;
      var box = $('#p2-scaleresult');
      var verdict, cls;
      if(ratio*100 > budget + 100){
        verdict = 'Kapasitas dasar perlu naik sekitar '+Math.round((ratio-1)*100)+'% namun anggaran hanya naik '+budget+'% &mdash; scaling vertikal penuh tidak cukup. Rekomendasi: scaling horizontal bertahap pada server aplikasi, caching data master, dan antrian untuk proses berat, sambil menunda redundansi penuh ke fase berikutnya.';
        cls = 'warn';
      } else {
        verdict = 'Kenaikan anggaran relatif sepadan dengan kenaikan pengguna &mdash; scaling bertahap kemungkinan mencukupi dengan pemantauan performa rutin.';
        cls = 'ok';
      }
      box.className = 'resultbox show '+cls;
      box.innerHTML = '<div class="kv"><span>Rasio kenaikan pengguna</span><b>'+ratio.toFixed(1)+'&times; (100 &rarr; '+users+')</b></div><div class="kv"><span>Kenaikan anggaran tersedia</span><b>'+budget+'%</b></div><p style="margin:8px 0 0;font-size:12.5px">'+verdict+'</p>';
      logSql('P2 / CAPACITY', 'EXPLAIN ANALYZE SELECT * FROM concurrent_connections WHERE max_pool >= ' + users + ';', 'Simulasi kapasitas koneksi (' + users + ' pengguna aktif).');
    });
  }
})();

/* =========================================================
   PRAKTIKUM 3
   ========================================================= */
(function(){
  function tier(v){
    if(v <= 5000000) return {n:1,label:'Kepala Lab'};
    if(v <= 20000000) return {n:2,label:'Pimpinan'};
    return {n:3,label:'Direktur'};
  }
  if($('#p3-check')){
    $('#p3-check').addEventListener('click', function(){
      var oldV = parseFloat($('#p3-old').value)||0, newV = parseFloat($('#p3-new').value)||0;
      var t1 = tier(oldV), t2 = tier(newV);
      var box = $('#p3-result');
      if(t1.n === t2.n){
        box.className = 'resultbox show ok';
        box.innerHTML = '<div class="kv"><span>Jenjang persetujuan awal</span><b>'+t1.label+' ('+rupiah(oldV)+')</b></div><div class="kv"><span>Jenjang persetujuan nilai baru</span><b>'+t2.label+' ('+rupiah(newV)+')</b></div><p style="margin:8px 0 0;font-size:12.5px"><b>Hasil:</b> Persetujuan sebelumnya masih berlaku &mdash; nilai baru tetap berada pada jenjang persetujuan yang sama.</p>';
      } else {
        box.className = 'resultbox show bad';
        box.innerHTML = '<div class="kv"><span>Jenjang persetujuan awal</span><b>'+t1.label+' ('+rupiah(oldV)+')</b></div><div class="kv"><span>Jenjang persetujuan nilai baru</span><b>'+t2.label+' ('+rupiah(newV)+')</b></div><p style="margin:8px 0 0;font-size:12.5px"><b>Hasil:</b> Persetujuan harus diulang &mdash; nilai baru melewati ambang jenjang semula, sehingga butuh otorisasi dari '+t2.label+'.</p>';
      }
      logSql('P3 / APPROVAL', 'SELECT rule_id, max_amount, approver_role FROM purchase_approval_matrix WHERE max_amount >= ' + newV + ' ORDER BY max_amount ASC LIMIT 1;', 'Pemeriksaan hirarki persetujuan PO: ' + t1.label + ' (' + rupiah(oldV) + ') -> ' + t2.label + ' (' + rupiah(newV) + ')');
    });
  }
})();

/* =========================================================
   PRAKTIKUM 4 — full accounting simulator
   ========================================================= */
(function(){
  var coa = [
    {code:'1101', name:'Kas', type:'Aset', normal:'debit'},
    {code:'1102', name:'Piutang Usaha', type:'Aset', normal:'debit'},
    {code:'1103', name:'Persediaan Bahan Baku', type:'Aset', normal:'debit'},
    {code:'2101', name:'Utang Usaha', type:'Kewajiban', normal:'kredit'},
    {code:'4101', name:'Penjualan', type:'Pendapatan', normal:'kredit'},
    {code:'5101', name:'Beban Operasional', type:'Beban', normal:'debit'}
  ];
  var coaTbody = $('#p4-coa tbody');
  if(coaTbody){
    coa.forEach(function(a){
      var tr = document.createElement('tr');
      tr.innerHTML = '<td class="mono">'+a.code+'</td><td>'+a.name+'</td><td>'+a.type+'</td><td class="num">'+a.normal+'</td>';
      coaTbody.appendChild(tr);
    });
  }

  var txTemplates = {
    buy:      {desc:'Pembelian bahan baku (kredit)', debit:'Persediaan Bahan Baku', credit:'Utang Usaha'},
    payvendor:{desc:'Pembayaran utang pemasok', debit:'Utang Usaha', credit:'Kas'},
    sell:     {desc:'Penjualan produk (kredit)', debit:'Piutang Usaha', credit:'Penjualan'},
    recv:     {desc:'Penerimaan pembayaran pelanggan', debit:'Kas', credit:'Piutang Usaha'},
    opex:     {desc:'Pembayaran beban operasional (tunai)', debit:'Beban Operasional', credit:'Kas'}
  };

  var initialCash = 30000000;
  var journal = store.get('p4-journal', [
    {id:1, desc:'Pembelian bahan baku (kredit)', debit:'Persediaan Bahan Baku', credit:'Utang Usaha', amt:8000000, tag:''},
    {id:2, desc:'Pembayaran utang pemasok', debit:'Utang Usaha', credit:'Kas', amt:3000000, tag:''},
    {id:3, desc:'Penjualan produk (kredit)', debit:'Piutang Usaha', credit:'Penjualan', amt:12000000, tag:''},
    {id:4, desc:'Penerimaan pembayaran pelanggan', debit:'Kas', credit:'Piutang Usaha', amt:5000000, tag:''},
    {id:5, desc:'Pembayaran beban operasional (tunai)', debit:'Beban Operasional', credit:'Kas', amt:1500000, tag:''}
  ]);
  var nextId = store.get('p4-nextid', 6);

  function saveJournal(){ store.set('p4-journal', journal); store.set('p4-nextid', nextId); }

  function renderJournal(){
    if(!$('#p4-journal')) return;
    var html = '<table class="data"><thead><tr><th>#</th><th>Keterangan</th><th>Debit</th><th>Kredit</th><th class="num">Nominal</th></tr></thead><tbody>';
    journal.forEach(function(j){
      var tagPill = j.tag ? ' <span class="pill '+(j.tag==='duplikat'?'bad':'ok')+'">'+j.tag+'</span>' : '';
      html += '<tr><td class="mono">'+j.id+'</td><td>'+j.desc+tagPill+'</td><td>'+j.debit+'</td><td>'+j.credit+'</td><td class="num">'+rupiah(j.amt)+'</td></tr>';
    });
    html += '</tbody></table>';
    $('#p4-journal').innerHTML = html;
  }

  function accountBalance(name){
    var acc = coa.filter(function(a){return a.name===name;})[0];
    if(!acc) return 0;
    var bal = (name==='Kas') ? initialCash : 0;
    journal.forEach(function(j){
      if(j.debit===name) bal += (acc.normal==='debit' ? j.amt : -j.amt);
      if(j.credit===name) bal += (acc.normal==='debit' ? -j.amt : j.amt);
    });
    return bal;
  }

  function renderLedger(){
    if(!$('#p4-ledger')) return;
    var html = '';
    coa.forEach(function(a){
      html += '<h4 style="font-size:13px;margin:14px 0 6px">'+a.name+' <span class="badge" style="font-size:10px;padding:2px 6px;border-radius:4px;background:var(--surface-3);color:var(--ink-dim)">'+a.normal+'</span></h4>';
      html += '<table class="data"><thead><tr><th>Keterangan</th><th class="num">Debit</th><th class="num">Kredit</th></tr></thead><tbody>';
      var running = (a.name==='Kas') ? initialCash : 0;
      if(a.name==='Kas') html += '<tr><td><em>Saldo awal</em></td><td class="num">&mdash;</td><td class="num">&mdash;</td></tr>';
      journal.forEach(function(j){
        if(j.debit===a.name) html += '<tr><td>'+j.desc+'</td><td class="num">'+rupiah(j.amt)+'</td><td class="num">&mdash;</td></tr>';
        if(j.credit===a.name) html += '<tr><td>'+j.desc+'</td><td class="num">&mdash;</td><td class="num">'+rupiah(j.amt)+'</td></tr>';
      });
      html += '</tbody></table>';
      html += '<div class="kv" style="padding:6px 10px;background:var(--surface-2);margin-top:2px;border-radius:0 0 6px 6px;"><span>Saldo akhir</span><b>'+rupiah(accountBalance(a.name))+'</b></div>';
    });
    $('#p4-ledger').innerHTML = html;
  }

  function renderTrial(){
    if(!$('#p4-trial')) return;
    var totalD=0, totalK=0;
    var html = '<table class="data"><thead><tr><th>Akun</th><th class="num">Debit</th><th class="num">Kredit</th></tr></thead><tbody>';
    coa.forEach(function(a){
      var bal = accountBalance(a.name);
      var isDebit = a.normal==='debit';
      var d = isDebit ? Math.max(bal,0) : 0;
      var k = isDebit ? 0 : Math.max(bal,0);
      if(!isDebit && bal<0){ d = Math.abs(bal); k=0; }
      if(isDebit && bal<0){ k = Math.abs(bal); d=0; }
      totalD += d; totalK += k;
      html += '<tr><td>'+a.name+'</td><td class="num">'+(d?rupiah(d):'&mdash;')+'</td><td class="num">'+(k?rupiah(k):'&mdash;')+'</td></tr>';
    });
    html += '<tr style="font-weight:700"><td>Total</td><td class="num">'+rupiah(totalD)+'</td><td class="num">'+rupiah(totalK)+'</td></tr>';
    html += '</tbody></table>';
    if(Math.round(totalD)!==Math.round(totalK)){
      html += '<p class="note" style="color:var(--bad)">Neraca saldo tidak seimbang &mdash; periksa kembali jurnal yang diinput.</p>';
    }
    $('#p4-trial').innerHTML = html;
  }

  function renderAll(){ renderJournal(); renderLedger(); renderTrial(); saveJournal(); }
  renderAll();

  $all('#p4-tabs .tabbtn').forEach(function(btn){
    btn.addEventListener('click', function(){
      $all('#p4-tabs .tabbtn').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');
      ['journal','ledger','trial'].forEach(function(t){
        if($('#p4-'+t)) $('#p4-'+t).style.display = (t===btn.dataset.t) ? '' : 'none';
      });
    });
  });

  if($('#p4-add')){
    $('#p4-add').addEventListener('click', function(){
      var type = $('#p4-type').value, amt = parseFloat($('#p4-amt').value)||0;
      if(amt<=0) return;
      var tpl = txTemplates[type];
      var newEntry = {id:nextId++, desc:tpl.desc, debit:tpl.debit, credit:tpl.credit, amt:amt, tag:''};
      journal.push(newEntry);
      renderAll();
      logSql('P4 / GL-POST', 'INSERT INTO gl_journal_lines (id, entry_desc, debit_account, credit_account, amount) VALUES (' + newEntry.id + ', \'' + tpl.desc + '\', \'' + tpl.debit + '\', \'' + tpl.credit + '\', ' + amt + ');', 'Posting jurnal manual ke Buku Besar.');
    });
  }

  window.addEventListener('erp:journal', function(e){
    var d = e.detail;
    var autoEntry = {id:nextId++, desc:d.desc, debit:d.debit, credit:d.credit, amt:d.amt, tag:'otomatis'};
    journal.push(autoEntry);
    renderAll();
    logSql('P4 / AUTO-POST', 'INSERT INTO gl_journal_lines (id, entry_desc, debit_account, credit_account, amount, origin) VALUES (' + autoEntry.id + ', \'' + d.desc + '\', \'' + d.debit + '\', \'' + d.credit + '\', ' + d.amt + ', \'SCM_EVENT\');', 'Posting jurnal otomatis dari Modul Pengadaan / SCM.');
  });

  var dupId = null;
  if($('#p4-dup')){
    $('#p4-dup').addEventListener('click', function(){
      var original = journal.filter(function(j){return j.debit==='Utang Usaha' && j.credit==='Kas';})[0];
      if(!original){ alert('Tidak ada transaksi pembayaran utang pemasok untuk diduplikasi.'); return; }
      var dup = {id:nextId++, desc:original.desc, debit:original.debit, credit:original.credit, amt:original.amt, tag:'duplikat'};
      journal.push(dup); dupId = dup.id;
      renderAll();
      if($('#p4-fix')) $('#p4-fix').disabled = false;
      var box = $('#p4-errbox');
      box.className = 'resultbox show bad';
      box.innerHTML = '<b>Terdeteksi anomali:</b> pembayaran ke pemasok sebesar '+rupiah(dup.amt)+' tercatat dua kali (#'+original.id+' dan #'+dup.id+'). <br><br><b>Dampak:</b> saldo Kas berkurang '+rupiah(dup.amt)+' lebih banyak dari seharusnya, dan saldo Utang Usaha menjadi lebih rendah dari yang seharusnya (berpotensi negatif).<br><br>Klik &ldquo;Buat jurnal koreksi&rdquo; untuk memperbaiki tanpa menghapus transaksi asli.';
      logSql('P4 / AUDIT-ANOMALY', 'INSERT INTO gl_journal_lines (id, entry_desc, debit_account, credit_account, amount, tag) VALUES (' + dup.id + ', \'' + dup.desc + '\', \'' + dup.debit + '\', \'' + dup.credit + '\', ' + dup.amt + ', \'DUPLICATE\'); -- WARNING: ANOMALY_TRIGGERED', 'Anomali terdeteksi: duplikasi pembayaran utang.');
    });
  }

  if($('#p4-fix')){
    $('#p4-fix').addEventListener('click', function(){
      if(dupId===null) return;
      var dup = journal.filter(function(j){return j.id===dupId;})[0];
      var rev = {id:nextId++, desc:'Jurnal pembalik koreksi duplikasi transaksi #'+dup.id, debit:dup.credit, credit:dup.debit, amt:dup.amt, tag:'koreksi'};
      journal.push(rev);
      renderAll();
      $('#p4-fix').disabled = true;
      var box = $('#p4-errbox');
      box.className = 'resultbox show ok';
      box.innerHTML = '<b>Koreksi tercatat (#'+rev.id+'):</b> jurnal pembalik Dr '+rev.debit+' / Cr '+rev.credit+' sebesar '+rupiah(rev.amt)+' ditambahkan, merujuk ke transaksi #'+dup.id+'. Transaksi asli dan duplikatnya <em>tidak dihapus</em> &mdash; jejak audit tetap lengkap dan bisa ditelusuri. Saldo Kas dan Utang Usaha kini kembali benar (lihat Buku Besar / Neraca Saldo).';
      logSql('P4 / AUDIT-REVERSAL', 'INSERT INTO gl_journal_lines (id, entry_desc, debit_account, credit_account, amount, tag, ref_id) VALUES (' + rev.id + ', \'' + rev.desc + '\', \'' + rev.debit + '\', \'' + rev.credit + '\', ' + rev.amt + ', \'REVERSAL\', ' + dup.id + ');', 'Jurnal pembalik dicatat untuk audit trail.');
      dupId = null;
    });
  }
})();

/* =========================================================
   PRAKTIKUM 5 — SCM / MRP
   ========================================================= */
(function(){
  var bom = { A: 3, B: 2 };
  var master = store.get('p5-master', {
    A: { stock: 400, incoming: 100, lead: 4 },
    B: { stock: 250, incoming: 0, lead: 7 }
  });
  function renderMaster(){
    var tb = $('#p5-master tbody');
    if(!tb) return;
    tb.innerHTML = '';
    ['A','B'].forEach(function(k){
      var m = master[k];
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>Bahan '+k+'</td><td class="num">'+m.stock+' unit</td><td class="num">'+m.incoming+' unit</td><td class="num">'+m.lead+' hari kerja</td>';
      tb.appendChild(tr);
    });
  }
  renderMaster();

  if($('#p5-calc')){
    $('#p5-calc').addEventListener('click', function(){
      var qty = parseInt($('#p5-qty').value,10) || 0;
      var usePo = $('#p5-usepo').checked;
      var box = $('#p5-result');
      var rows = ['A','B'].map(function(k){
        var m = master[k];
        var gross = qty * bom[k];
        var incoming = usePo ? m.incoming : 0;
        var net = Math.max(gross - m.stock - incoming, 0);
        return {k:k, gross:gross, stock:m.stock, incoming:incoming, net:net};
      });
      var dl = parseFloat($('#p5-deadline2').value)||0;
      var html = '<table class="data"><thead><tr><th>Komponen</th><th class="num">Kebutuhan bruto</th><th class="num">Stok</th><th class="num">Pesanan masuk dipakai</th><th class="num">Kebutuhan bersih</th><th class="num">Waktu pengadaan</th><th>Status waktu</th></tr></thead><tbody>';
      var late = [];
      rows.forEach(function(r){
        var lead = master[r.k].lead;
        var st = r.net<=0 ? 'Aman (tanpa beli)' : (lead>dl ? 'Terlambat '+(lead-dl)+' hr' : 'Aman');
        if(r.net>0 && lead>dl) late.push(r.k);
        html += '<tr><td>Bahan '+r.k+'</td><td class="num">'+r.gross+'</td><td class="num">'+r.stock+'</td><td class="num">'+r.incoming+'</td><td class="num"><b>'+r.net+'</b></td><td class="num">'+lead+' hr</td><td>'+st+'</td></tr>';
      });
      html += '</tbody></table>';
      if(late.length){
        html += '<p style="margin:10px 0 0;font-size:12.5px;color:var(--bad)"><b>Peringatan:</b> waktu pengadaan Bahan '+late.join(' dan ')+' melebihi batas produksi '+dl+' hari kerja. Pembelian normal tidak akan tepat waktu &mdash; lihat Tahap 5.</p>';
      }
      var needPurchase = rows.filter(function(r){return r.net>0;});
      if(needPurchase.length){
        html += '<p style="margin:10px 0 0;font-size:12.5px"><b>Rekomendasi permintaan pembelian:</b> '+needPurchase.map(function(r){return r.net+' unit Bahan '+r.k;}).join(' dan ')+'.</p>';
        $('#p5-result').className = 'resultbox show ' + (late.length?'bad':'warn');
      } else {
        html += '<p style="margin:10px 0 0;font-size:12.5px"><b>Rekomendasi permintaan pembelian:</b> tidak diperlukan &mdash; stok dan pesanan yang sudah berjalan mencukupi kebutuhan produksi ini.</p>';
        $('#p5-result').className = 'resultbox show ok';
      }
      $('#p5-result').innerHTML = html;
      logSql('P5 / MRP-CALC', 'SELECT m.item, m.stock, m.incoming, (' + qty + ' * b.ratio) as gross_req, ((' + qty + ' * b.ratio) - m.stock - ' + (usePo ? 'm.incoming' : '0') + ') as net_req FROM material_master m JOIN bom b ON b.item = m.item;', 'Kalkulasi kebutuhan bersih material (MRP) untuk ' + qty + ' unit produksi.');
    });
  }

  var price = {A:10000, B:15000};
  var docs = store.get('p5-docs', null);
  if(!docs){
    docs = [];
    ['A','B'].forEach(function(k){ if(master[k].incoming>0) docs.push({no:'PO-'+('00'+(docs.length+1)).slice(-3), item:k, qty:master[k].incoming, recv:0, eta:master[k].lead}); });
  }
  function saveAll(){ store.set('p5-master', master); store.set('p5-docs', docs); renderMaster(); renderDocs(); }
  function renderDocs(){
    var tb = $('#p5-docs tbody');
    if(!tb) return;
    tb.innerHTML = '';
    if(!docs.length){ tb.innerHTML = '<tr><td colspan="7" class="hint">Belum ada PO.</td></tr>'; return; }
    docs.forEach(function(d){
      var left = d.qty - d.recv;
      var st = left===0 ? 'Diterima penuh' : (d.recv>0 ? 'Diterima sebagian' : 'PO terbit (disetujui)');
      var tr = document.createElement('tr');
      tr.innerHTML = '<td class="mono">'+d.no+'</td><td>Bahan '+d.item+'</td><td class="num">'+d.qty+'</td><td class="num">'+d.recv+'</td><td class="num">'+left+'</td><td class="num">'+d.eta+' hr</td><td>'+st+'</td>';
      tb.appendChild(tr);
    });
  }
  renderDocs();

  function netNeeds(){
    var qty = parseInt($('#p5-qty').value,10) || 0, usePo = $('#p5-usepo').checked;
    return ['A','B'].map(function(k){
      var m = master[k];
      return {k:k, net:Math.max(qty*bom[k] - m.stock - (usePo ? m.incoming : 0), 0)};
    }).filter(function(r){ return r.net>0; });
  }

  if($('#p5-autoorder')){
    $('#p5-autoorder').addEventListener('click', function(){
      var box = $('#p5-autoresult'), needs = netNeeds();
      if(!needs.length){ box.className='resultbox show ok'; box.innerHTML='Tidak ada kekurangan material &mdash; PR/PO tidak perlu dibuat.'; return; }
      var dl = parseFloat($('#p5-deadline2').value)||0, html = '', late = [];
      needs.forEach(function(r){
        var no = 'PO-'+('00'+(docs.length+1)).slice(-3);
        docs.push({no:no, item:r.k, qty:r.net, recv:0, eta:master[r.k].lead});
        master[r.k].incoming += r.net;
        if(master[r.k].lead > dl) late.push(r.k);
        html += '<div class="kv"><span>'+no+' &mdash; PR dibuat &rarr; disetujui &rarr; PO terbit</span><b>'+r.net+' unit Bahan '+r.k+' (Rp'+(r.net*price[r.k]).toLocaleString('id-ID')+')</b></div>';
      });
      if(late.length) html += '<p style="margin:8px 0 0;font-size:12.5px;color:var(--bad)"><b>Peringatan:</b> Bahan '+late.join(' dan ')+' tiba lebih lama dari batas produksi '+dl+' hari kerja. Gunakan Tahap 5 untuk pemasok alternatif.</p>';
      box.className = 'resultbox show ' + (late.length ? 'bad' : 'ok'); box.innerHTML = html;
      saveAll();
      logSql('P5 / PO-ISSUE', 'INSERT INTO purchase_orders (po_no, item, qty, eta_days, status) VALUES ' + needs.map(function(r){return '(\'PO-' + r.k + '\', \'' + r.k + '\', ' + r.net + ', ' + master[r.k].lead + ', \'ISSUED\')';}).join(', ') + ';', 'Penerbitan Purchase Order otomatis untuk material yang defisit.');
      if($('#p5-calc')) $('#p5-calc').click();
    });
  }

  function doReceive(item, qty){
    var m = master[item];
    if(qty <= 0) return {err:'Jumlah diterima harus lebih dari 0.'};
    if(qty > m.incoming) return {err:'<b>Ditolak:</b> jumlah diterima ('+qty+') melebihi sisa pesanan belum diterima Bahan '+item+' ('+m.incoming+' unit). Buat PO dulu atau kurangi jumlah.'};
    m.stock += qty; m.incoming -= qty;
    var left = qty;
    docs.forEach(function(d){
      if(d.item!==item || left<=0) return;
      var take = Math.min(left, d.qty-d.recv); d.recv += take; left -= take;
    });
    if($('#p5-autojournal') && $('#p5-autojournal').checked){
      window.dispatchEvent(new CustomEvent('erp:journal', {detail:{desc:'Penerimaan '+qty+' unit Bahan '+item+' (kredit, otomatis dari modul pembelian)', debit:'Persediaan Bahan Baku', credit:'Utang Usaha', amt:qty*price[item]}}));
    }
    saveAll();
    logSql('P5 / GOODS-RECEIPT', 'UPDATE purchase_orders SET recv = recv + ' + qty + ' WHERE item = \'' + item + '\'; UPDATE raw_inventory SET stock = stock + ' + qty + ' WHERE item = \'' + item + '\';', 'Penerimaan barang (Goods Receipt) ' + qty + ' unit Bahan ' + item + ' & penambahan stok.');
    return {ok:true};
  }

  if($('#p5-recv-item')){
    $('#p5-recv-item').addEventListener('change', function(){ $('#p5-recv-qty').value = master[this.value].incoming; });
  }

  if($('#p5-recv')){
    $('#p5-recv').addEventListener('click', function(){
      var item = $('#p5-recv-item').value, qty = parseInt($('#p5-recv-qty').value,10) || 0;
      var r = doReceive(item, qty), box = $('#p5-recvresult'), m = master[item];
      if(r.err){ box.className='resultbox show bad'; box.innerHTML=r.err; return; }
      box.className = 'resultbox show ok';
      box.innerHTML = '<div class="kv"><span>Diterima</span><b>'+qty+' unit Bahan '+item+'</b></div><div class="kv"><span>Stok tersedia sekarang</span><b>'+m.stock+' unit</b></div><div class="kv"><span>Sisa pesanan belum diterima</span><b>'+m.incoming+' unit</b></div><p style="margin:8px 0 0;font-size:12.5px">Status PO: '+(m.incoming>0?'diterima sebagian (sisa '+m.incoming+' unit)':'diterima penuh')+'.'+($('#p5-autojournal') && $('#p5-autojournal').checked?' Jurnal utang otomatis tercatat di Praktikum 4.':'')+'</p>';
    });
  }

  if($('#p5-recvall')){
    $('#p5-recvall').addEventListener('click', function(){
      var box = $('#p5-autoresult'), html = '', any = false;
      ['A','B'].forEach(function(k){
        var q = master[k].incoming;
        if(q>0 && doReceive(k, q).ok){ any = true; html += '<div class="kv"><span>Penerimaan PO Bahan '+k+'</span><b>+'+q+' unit &rarr; stok '+master[k].stock+'</b></div>'; }
      });
      box.className = 'resultbox show ' + (any?'ok':'warn');
      box.innerHTML = any ? html : 'Tidak ada PO terbuka untuk diterima.';
    });
  }

  if($('#p5-riskresult')){
    $('#p5-riskresult').addEventListener('click', function(e){
      if(e.target.id !== 'p5-applyalt') return;
      var alt = parseFloat($('#p5-altlead').value)||0, dl = parseFloat($('#p5-deadline2').value)||0;
      master.B.lead = alt;
      docs.forEach(function(d){ if(d.item==='B' && d.recv<d.qty) d.eta = alt; });
      saveAll();
      this.className = 'resultbox show ' + (alt<=dl?'ok':'bad');
      this.innerHTML = '<b>Pemasok alternatif diterapkan:</b> waktu pengadaan Bahan B menjadi '+alt+' hari kerja; PO Bahan B yang masih terbuka diperbarui. '+(alt<=dl?'Sekarang memenuhi batas produksi '+dl+' hari.':'<span style="color:var(--bad)">Masih melebihi batas '+dl+' hari &mdash; pertimbangkan jadwal ulang atau stok dari lokasi lain.</span>');
      logSql('P5 / SCM-ALTERNATIVE', 'UPDATE suppliers SET preferred = true WHERE item = \'B\' AND lead_time = ' + alt + '; UPDATE purchase_orders SET eta = ' + alt + ' WHERE item = \'B\' AND recv < qty;', 'Pemasok alternatif diaktifkan: lead time Bahan B dipersingkat menjadi ' + alt + ' hari.');
    });
  }

  if($('#p5-deadline2') && $('#p5-deadline')){
    $('#p5-deadline2').addEventListener('input', function(){ $('#p5-deadline').value = this.value; });
  }

  if($('#p5-risk')){
    $('#p5-risk').addEventListener('click', function(){
      $('#p5-deadline').value = $('#p5-deadline2').value;
      var lead = parseFloat($('#p5-leadtime').value)||0, deadline = parseFloat($('#p5-deadline').value)||0;
      master.B.lead = lead; store.set('p5-master', master); renderMaster();
      var box = $('#p5-riskresult');
      if(lead > deadline){
        box.className = 'resultbox show bad';
        box.innerHTML = '<div class="kv"><span>Waktu kirim pemasok</span><b>'+lead+' hari kerja</b></div><div class="kv"><span>Batas waktu produksi</span><b>'+deadline+' hari kerja</b></div><p style="margin:8px 0 0;font-size:12.5px"><b>Risiko:</b> pemasok tidak dapat memenuhi tenggat (terlambat '+(lead-deadline)+' hari). <b>Rekomendasi:</b> cari pemasok alternatif dengan waktu kirim &le; '+deadline+' hari, gunakan sisa persediaan dari gudang/lokasi lain untuk menutup selisih waktu, atau negosiasikan penyusunan ulang jadwal produksi jika kedua opsi di atas tidak memungkinkan. Keputusan akhir harus mempertimbangkan biaya tambahan tiap opsi dan dampak ke jadwal pelanggan.</p><p style="margin:10px 0 0"><button class="btn" id="p5-applyalt">Terapkan pemasok alternatif otomatis</button></p>';
      } else {
        box.className = 'resultbox show ok';
        box.innerHTML = '<div class="kv"><span>Waktu kirim pemasok</span><b>'+lead+' hari kerja</b></div><div class="kv"><span>Batas waktu produksi</span><b>'+deadline+' hari kerja</b></div><p style="margin:8px 0 0;font-size:12.5px"><b>Hasil:</b> pemasok masih dapat memenuhi tenggat produksi &mdash; pengadaan dapat dilanjutkan tanpa perubahan jadwal, namun tetap pantau konfirmasi pengiriman mendekati tanggal jatuh tempo.</p>';
      }
      logSql('P5 / SCM-AUDIT', 'SELECT lead_time, deadline_days, (lead_time - deadline_days) as delay FROM supplier_contracts WHERE item=\'B\';', 'Pemeriksaan risiko keterlambatan pengiriman pemasok Bahan B (' + lead + ' hari vs batas ' + deadline + ' hari).');
    });
  }
})();

})();
