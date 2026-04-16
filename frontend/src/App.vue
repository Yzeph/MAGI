<template>
  <div id="app">
    <MAGIInterface />
  </div>
</template>

<script setup>
import MAGIInterface from './components/MAGIInterface.vue'
</script>

<style>
/* Reset everything to ensure fullscreen edge-to-edge layout */
html, body, #app {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  background-color: #000;
  overflow: hidden;
}
</style>
