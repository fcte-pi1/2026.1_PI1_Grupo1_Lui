#  Nossa Equipe

<div class="org-wrapper" id="scroll-container">
  <div class="org-tree" id="org-content">
    
    <!-- GERENTE GERAL -->
    <div class="org-card">
      <img class="org-avatar" src="../assets/team/ian-costa.jpg" alt="Ian Costa">
      <h3>Ian Costa</h3>
      <p>Gerente Geral</p>
    </div>

    <div class="line-v"></div>

    <!-- SUB-GERENTE -->
    <div class="org-card">
      <img class="org-avatar" src="../assets/team/julia.jpg" alt="Júlia">
      <h3>Júlia</h3>
      <p>Sub-gerente</p>
    </div>

    <div class="line-v"></div>
    <div class="area-connector"></div>

    <div class="org-level" style="padding-top: 15px;">
      
      <!-- COLUNA ESTRUTURAS -->
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div class="org-card">
          <img class="org-avatar" src="../assets/team/bianca-zero.jpg" alt="Bianca Zero">
          <h3>Bianca Zero</h3>
          <p>Gerente Estruturas</p>
        </div>
        <div class="line-v"></div>
        <div class="org-level" style="border-top: 2px solid #ccc; padding-top: 15px;">
          <div class="org-card">
            <img class="org-avatar" src="../assets/team/gabriel-vale.jpg" alt="Gabriel Vale">
            <h3>Gabriel Vale</h3><p>Estruturas</p>
          </div>
          <div class="org-card">
            <img class="org-avatar" src="../assets/team/arthur-mateus.jpg" alt="Arthur Mateus">
            <h3>Arthur Mateus</h3><p>Estruturas</p>
          </div>
          <div class="org-card">
            <img class="org-avatar" src="../assets/team/ruan-apostolo.jpg" alt="Ruan Apostolo">
            <h3>Ruan Apostolo</h3><p>Estruturas</p>
          </div>
          <div class="org-card">
            <img class="org-avatar" src="../assets/team/alexandre-macedo.jpg" alt="Alexandre Macedo">
            <h3>Alexandre Macedo</h3><p>Estruturas</p>
          </div>
        </div>
      </div>

      <!-- COLUNA ELETRÔNICA -->
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div class="org-card">
          <img class="org-avatar" src="../assets/team/jose-vinicius.jpg" alt="José Vinicius">
          <h3>José Vinicius</h3>
          <p>Gerente Eletrônica</p>
        </div>
        <div class="line-v"></div>
        <div class="org-level" style="border-top: 2px solid #ccc; padding-top: 15px;">
          <div class="org-card">
            <img class="org-avatar" src="../assets/team/arthur-augusto.jpg" alt="Arthur Augusto">
            <h3>Arthur Augusto</h3><p>Eletrônica</p>
          </div>
          <div class="org-card">
            <img class="org-avatar" src="../assets/team/caio-bechepeche.jpg" alt="Caio Bechepeche">
            <h3>Caio Bechepeche</h3><p>Eletrônica</p>
          </div>
          <div class="org-card">
            <img class="org-avatar" src="../assets/team/joao-victor.jpg" alt="João Victor">
            <h3>João Victor</h3><p>Eletrônica</p>
          </div>
          <div class="org-card">
            <img class="org-avatar" src="../assets/team/mauricio-araujo.jpg" alt="Maurício Araújo">
            <h3>Maurício Araújo</h3><p>Eletrônica</p>
          </div>
          <div class="org-card">
            <img class="org-avatar" src="../assets/team/renato-rodrigues.jpg" alt="Renato Rodrigues">
            <h3>Renato Rodrigues</h3><p>Eletrônica</p>
          </div>
        </div>
      </div>

      <!-- COLUNA SOFTWARE -->
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div class="org-card">
          <img class="org-avatar" src="../assets/team/yzabella-pimenta.jpg" alt="Yzabella Pimenta">
          <h3>Yzabella Pimenta</h3>
          <p>Gerente Software</p>
        </div>
        <div class="line-v"></div>
        <div class="org-level" style="border-top: 2px solid #ccc; padding-top: 15px;">
          <div class="org-card">
            <img class="org-avatar" src="../assets/team/caio-melo.jpg" alt="Caio Melo">
            <h3>Caio Melo</h3><p>Software</p>
          </div>
          <div class="org-card">
            <img class="org-avatar" src="../assets/team/carlos-eduardo.jpg" alt="Carlos Eduardo">
            <h3>Carlos Eduardo</h3><p>Software</p>
          </div>
          <div class="org-card">
            <img class="org-avatar" src="../assets/team/renan-curione.jpg" alt="Renan Curione">
            <h3>Renan Curione</h3><p>Software</p>
          </div>
          <div class="org-card">
            <img class="org-avatar" src="../assets/team/sauhan-melo.jpg" alt="Sauhan Melo">
            <h3>Sauhan Melo</h3><p>Software</p>
          </div>
        </div>
      </div>

      <!-- COLUNA ENERGIA -->
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div class="org-card">
          <img class="org-avatar" src="../assets/team/ana-luiza.jpg" alt="Ana Luiza Soares">
          <h3>Ana Luiza Soares</h3>
          <p>Gerente Energia</p>
        </div>
      </div>

    </div>
  </div>
</div>

<script>
  window.addEventListener('load', function() {
    const container = document.getElementById('scroll-container');
    const content = document.getElementById('org-content');
    if (container && content) {
      const center = (content.offsetWidth - container.offsetWidth) / 2;
      container.scrollLeft = center;
    }
  });
</script>