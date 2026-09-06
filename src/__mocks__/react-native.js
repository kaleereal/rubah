const React = require('react');

const View = (props) => React.createElement('div', props, props.children);
const Text = (props) => React.createElement('span', props, props.children);
const TouchableOpacity = (props) => React.createElement('button', props, props.children);
const TextInput = (props) => React.createElement('input', props);
const FlatList = (props) =>
  React.createElement(
    'div',
    null,
    props.data ? props.data.map((item, index) => props.renderItem({ item, index })) : props.ListEmptyComponent
  );
const Modal = (props) => (props.visible ? React.createElement('div', props, props.children) : null);
const SafeAreaView = (props) => React.createElement('div', props, props.children);
const ScrollView = (props) => React.createElement('div', props, props.children);
const Alert = { alert: () => {} };
const StyleSheet = { create: (styles) => styles };

module.exports = {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  Alert,
  StyleSheet,
};
